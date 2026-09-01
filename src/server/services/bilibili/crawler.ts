/**
 * B站 VOCALOID 歌曲采集服务
 */
import { PrismaClient } from '@prisma/client';
import { searchByKeyword, getVideoDetail, delay, listVocaloidPartition } from './client';
import { calculateScore } from '../ranking/scorer';
import { checkSongMilestones } from '../milestone';
import type { BiliSearchVideo, BiliVideoDetail, SongData } from './types';
import { chinaDateKey } from '../../../lib/time';
import { SETTING_KEYS, getSetting, setSetting, getIngestBlocklist, removeIngestBlock } from '../settings';
import { SEARCH_KEYWORDS } from './voices';
import {
  judgeGrayBatch,
  judgeOriginality,
  type GraySongInput,
  type OriginalityInput,
} from './originality';

export { judgeOriginality } from './originality';

let _prisma: PrismaClient | null = null;
function getPrisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

const REMIX_KEYWORDS = ['remix', 'Remix', 'REMIX', 'Rearrange', 'rearrange'];
const COVER_KEYWORDS = ['翻唱', '翻填', 'cover', 'Cover', 'COVER', 'カバー', '翻调', '歌ってみた'];

function detectCategory(title: string, description: string): string {
  const text = `${title} ${description}`;
  if (REMIX_KEYWORDS.some((kw) => text.includes(kw))) return 'remix';
  if (COVER_KEYWORDS.some((kw) => text.includes(kw))) return 'cover';
  return 'original';
}

function bump(stats: Record<string, number>, key: string) {
  stats[key] = (stats[key] || 0) + 1;
}

function fromSearch(v: BiliSearchVideo): OriginalityInput {
  return {
    title: v.title,
    description: v.description,
    tags: v.tags,
    duration: v.duration,
    copyright: v.copyright,
    tid: v.tid,
    tname: v.tname,
    matchedSearchTags: v.tag ? [v.tag] : undefined,
  };
}

function fromDetail(d: BiliVideoDetail, matched?: string[]): OriginalityInput {
  return {
    title: d.title,
    description: d.description,
    tags: d.tags,
    duration: d.duration,
    copyright: d.copyright,
    tid: d.tid,
    tname: d.tname,
    matchedSearchTags: matched,
  };
}

function toSongData(detail: BiliVideoDetail): SongData {
  return {
    bvId: detail.bvid,
    title: detail.title,
    author: detail.author,
    authorAvatar: detail.authorAvatar,
    publishTime: new Date(detail.pubdate * 1000),
    description: detail.description,
    duration: detail.duration,
    picUrl: detail.pic,
    tags: detail.tags,
    statistics: {
      playCount: detail.statistics.view,
      likes: detail.statistics.like,
      coins: detail.statistics.coin,
      favorites: detail.statistics.favorite,
      shares: detail.statistics.share,
      comments: detail.statistics.reply,
    },
  };
}

async function persistSong(detail: BiliVideoDetail) {
  const prisma = getPrisma();
  const songData = toSongData(detail);
  const score = calculateScore(songData.statistics);
  const song = await prisma.song.upsert({
    where: { bvId: songData.bvId },
    update: {
      statistics: JSON.stringify(songData.statistics),
      tags: JSON.stringify(songData.tags),
      description: songData.description,
      score,
      authorAvatar: songData.authorAvatar || undefined,
    },
    create: {
      bvId: songData.bvId,
      title: songData.title,
      author: songData.author,
      authorAvatar: songData.authorAvatar,
      publishTime: songData.publishTime,
      description: songData.description,
      duration: songData.duration,
      picUrl: songData.picUrl,
      tags: JSON.stringify(songData.tags),
      statistics: JSON.stringify(songData.statistics),
      score,
    },
  });
  await checkSongMilestones(song.id, songData.statistics.playCount);
  const today = chinaDateKey();
  await prisma.songDailyStats.upsert({
    where: { songId_date: { songId: song.id, date: today } },
    update: {
      playCount: songData.statistics.playCount,
      likes: songData.statistics.likes,
      coins: songData.statistics.coins,
      favorites: songData.statistics.favorites,
      shares: songData.statistics.shares,
      comments: songData.statistics.comments,
      score,
    },
    create: {
      songId: song.id,
      date: today,
      playCount: songData.statistics.playCount,
      likes: songData.statistics.likes,
      coins: songData.statistics.coins,
      favorites: songData.statistics.favorites,
      shares: songData.statistics.shares,
      comments: songData.statistics.comments,
      score,
    },
  });
  const category = detectCategory(songData.title, songData.description || '');
  if (song.category !== category) {
    await prisma.song.update({ where: { id: song.id }, data: { category } });
  }
  return song;
}

export interface CrawlOptions {
  withinHours?: number;
  requestDelay?: number;
  tags?: string[];
  verbose?: boolean;
}

export interface CrawlResult {
  totalVideos: number;
  originalCount: number;
  savedCount: number;
  errors: string[];
  skipped?: boolean;
  filterStats?: Record<string, number>;
}

export async function runCrawl(
  options: CrawlOptions = {},
): Promise<CrawlResult> {
  const {
    withinHours = 168,
    requestDelay = 500,
    tags = SEARCH_KEYWORDS,
    verbose = false,
  } = options;

  const log = verbose ? console.log : () => {};
  const errors: string[] = [];
  const filterStats: Record<string, number> = {};
  const prisma = getPrisma();

  const enabled = await prisma.setting.findUnique({ where: { key: 'crawl_enabled' } });
  if (enabled?.value === 'false') {
    log('采集已关闭（crawl_enabled=false），跳过');
    return { totalVideos: 0, originalCount: 0, savedCount: 0, errors: [], skipped: true, filterStats };
  }

  const since = Date.now() / 1000 - withinHours * 3600;
  const blocked = new Set(await getIngestBlocklist(prisma));
  const videoMap = new Map<string, BiliSearchVideo & { matchedTags: string[] }>();

  const mergeHit = (v: BiliSearchVideo) => {
    if (!v.bvid || v.pubdate < since) return;
    const existing = videoMap.get(v.bvid);
    const tag = v.tag || '';
    if (existing) {
      if (tag && !existing.matchedTags.includes(tag)) existing.matchedTags.push(tag);
      if ((!existing.tags || existing.tags.length === 0) && v.tags?.length) existing.tags = v.tags;
      if (!existing.duration && v.duration) existing.duration = v.duration;
      if (!existing.tid && v.tid) existing.tid = v.tid;
      if (!existing.copyright && v.copyright) existing.copyright = v.copyright;
      return;
    }
    videoMap.set(v.bvid, { ...v, matchedTags: tag ? [tag] : [] });
  };

  log(`开始搜索 ${tags.length} 个标签，过滤 ${withinHours}h 内的视频...`);
  for (const tag of tags) {
    const videos = await searchByKeyword(tag);
    for (const v of videos) mergeHit(v);
    await delay(requestDelay);
  }

  log('拉取 VOCALOID 分区新稿...');
  const partition = await listVocaloidPartition(2);
  for (const v of partition) mergeHit(v);

  const totalVideos = videoMap.size;
  log(`搜索完成，共去重后 ${totalVideos} 个视频`);

  const candidates: (BiliSearchVideo & { matchedTags: string[] })[] = [];
  for (const v of Array.from(videoMap.values())) {
    const first = judgeOriginality({ ...fromSearch(v), matchedSearchTags: v.matchedTags });
    if (first.decision === 'reject') {
      bump(filterStats, first.reason.split(':')[0] || first.reason);
      if (verbose) log(`  粗筛排除: ${v.title.substring(0, 40)} → ${first.reason}`);
      continue;
    }
    candidates.push(v);
  }
  log(`粗筛通过 ${candidates.length} 个，拉详情终判`);

  let savedCount = 0;
  const grayItems: { input: GraySongInput; detail: BiliVideoDetail }[] = [];

  for (const v of candidates) {
    try {
      const detail = await getVideoDetail(v.bvid);
      if (!detail) {
        bump(filterStats, '详情失败');
        continue;
      }
      const judgment = judgeOriginality(fromDetail(detail, v.matchedTags));
      if (judgment.decision === 'reject') {
        bump(filterStats, judgment.reason.split(':')[0] || judgment.reason);
        if (verbose) log(`  终判排除: ${detail.title.substring(0, 40)} → ${judgment.reason}`);
        await delay(requestDelay);
        continue;
      }
      if (blocked.has(detail.bvid)) {
        bump(filterStats, '管理员已删');
        if (verbose) log(`  黑名单跳过: ${detail.title.substring(0, 40)}`);
        await delay(requestDelay);
        continue;
      }
      if (judgment.decision === 'accept') {
        await persistSong(detail);
        savedCount++;
        bump(filterStats, '规则通过');
        await delay(requestDelay);
        continue;
      }
      grayItems.push({
        detail,
        input: {
          bvId: detail.bvid,
          title: detail.title,
          author: detail.author,
          description: detail.description,
          tags: detail.tags,
          tname: detail.tname,
          duration: detail.duration,
          reason: judgment.reason,
        },
      });
      bump(filterStats, '灰区');
      await delay(requestDelay);
    } catch (err: any) {
      errors.push(`${v.bvid}: ${err.message}`);
    }
  }

  if (grayItems.length) {
    const { isAiConfigured, completePrompt } = await import('../ai');
    const callModel = (await isAiConfigured()) ? completePrompt : undefined;
    if (!callModel) bump(filterStats, '灰区无模型');
    for (let i = 0; i < grayItems.length; i += 10) {
      const chunk = grayItems.slice(i, i + 10);
      const verdicts = await judgeGrayBatch(chunk.map((c) => c.input), callModel);
      const byBv = new Map(chunk.map((c) => [c.detail.bvid, c.detail]));
      for (const ver of verdicts) {
        if (!ver.accept) {
          bump(filterStats, callModel ? '灰区拒绝' : '灰区跳过');
          if (verbose) log(`  灰区排除: ${ver.bvId} → ${ver.reason}`);
          continue;
        }
        const detail = byBv.get(ver.bvId);
        if (!detail) continue;
        if (blocked.has(detail.bvid)) {
          bump(filterStats, '管理员已删');
          continue;
        }
        try {
          await persistSong(detail);
          savedCount++;
          bump(filterStats, '灰区通过');
        } catch (err: any) {
          errors.push(`${ver.bvId}: ${err.message}`);
        }
      }
    }
  }

  log(`入库完成，成功保存 ${savedCount} 首，失败 ${errors.length} 首`);
  if (verbose) log(`筛选计数: ${JSON.stringify(filterStats)}`);

  await prisma.setting.upsert({
    where: { key: 'last_crawl_time' },
    update: { value: new Date().toISOString() },
    create: { key: 'last_crawl_time', value: new Date().toISOString() },
  });

  return {
    totalVideos,
    originalCount: candidates.length,
    savedCount,
    errors,
    filterStats,
  };
}

export async function ingestBv(
  rawBv: string,
  options: { force?: boolean } = {},
): Promise<{ bvId: string; title: string; created: boolean }> {
  const prisma = getPrisma();
  const bvId = rawBv.trim().match(/BV[0-9A-Za-z]+/i)?.[0];
  if (!bvId) throw new Error('无效的 BV 号');

  if (options.force) {
    await removeIngestBlock(prisma, bvId);
  } else {
    const blocked = await getIngestBlocklist(prisma);
    if (blocked.includes(bvId)) throw new Error('这首歌已被管理员删除，补录请用强制入库');
  }

  const detail = await getVideoDetail(bvId);
  if (!detail) throw new Error('B 站找不到这个视频');

  if (!options.force) {
    const judgment = judgeOriginality(fromDetail(detail));
    if (judgment.decision === 'reject') {
      throw new Error(`未通过原创判定：${judgment.reason}`);
    }
    if (judgment.decision === 'gray') {
      const { isAiConfigured, completePrompt } = await import('../ai');
      const [verdict] = await judgeGrayBatch(
        [{
          bvId: detail.bvid,
          title: detail.title,
          author: detail.author,
          description: detail.description,
          tags: detail.tags,
          tname: detail.tname,
          duration: detail.duration,
          reason: judgment.reason,
        }],
        (await isAiConfigured()) ? completePrompt : undefined,
      );
      if (!verdict?.accept) {
        throw new Error(`未通过原创判定：${verdict?.reason || judgment.reason}`);
      }
    }
  }

  const existing = await prisma.song.findUnique({ where: { bvId: detail.bvid }, select: { id: true } });
  const song = await persistSong(detail);
  return { bvId: song.bvId, title: song.title, created: !existing };
}

/**
 * 刷新所有已有歌曲的统计数据
 * 遍历全部歌曲，从 B 站拉取最新数据并更新
 * 为播放量趋势图提供数据积累
 */
export async function refreshAllSongs(
  options: { requestDelay?: number; batchSize?: number } = {},
): Promise<{ refreshed: number; failed: number; deletedBvIds: string[]; skipped: number }> {
  const { requestDelay = 500, batchSize = 20 } = options;
  const prisma = getPrisma();
  const today = chinaDateKey();
  const todayKey = today.toISOString().slice(0, 10);

  const storedDay = await getSetting(prisma, SETTING_KEYS.refreshDay);
  if (storedDay !== todayKey) {
    await setSetting(prisma, SETTING_KEYS.refreshDay, todayKey);
    await setSetting(prisma, SETTING_KEYS.refreshCursor, '');
  }
  const cursorId = (await getSetting(prisma, SETTING_KEYS.refreshCursor)) || '';

  const doneRows = await prisma.songDailyStats.findMany({
    where: { date: today },
    select: { songId: true },
  });
  const done = new Set(doneRows.map((r: { songId: string }) => r.songId));

  const allSongs = await prisma.song.findMany({
    select: { id: true, bvId: true, title: true },
    orderBy: { id: 'asc' },
  });

  const startIdx = cursorId ? allSongs.findIndex((s: { id: string }) => s.id === cursorId) + 1 : 0;
  const queue = allSongs.slice(Math.max(0, startIdx));
  console.log(`[Refresh] 共 ${allSongs.length} 首，今日已有快照 ${done.size}，从 ${startIdx} 续跑`);

  let refreshed = 0;
  let failed = 0;
  let skipped = 0;
  const deletedBvIds: string[] = [];

  for (let i = 0; i < queue.length; i++) {
    const song = queue[i];
    if (i > 0 && i % batchSize === 0) {
      await setSetting(prisma, SETTING_KEYS.refreshCursor, song.id);
      console.log(`[Refresh] 进度 ${startIdx + i}/${allSongs.length}`);
    }

    if (done.has(song.id)) {
      skipped++;
      continue;
    }

    try {
      const detail = await getVideoDetail(song.bvId);
      await delay(requestDelay);

      if (!detail) {
        deletedBvIds.push(song.bvId);
        console.log(`[Refresh] ${song.title} (${song.bvId}) 已无法访问，跳过`);
        failed++;
        continue;
      }

      const stats = {
        playCount: detail.statistics.view,
        likes: detail.statistics.like,
        coins: detail.statistics.coin,
        favorites: detail.statistics.favorite,
        shares: detail.statistics.share,
        comments: detail.statistics.reply,
      };

      const score = calculateScore(stats);

      await prisma.song.update({
        where: { id: song.id },
        data: {
          statistics: JSON.stringify(stats),
          score,
          authorAvatar: detail.authorAvatar || undefined,
        },
      });

      await prisma.songDailyStats.upsert({
        where: { songId_date: { songId: song.id, date: today } },
        update: {
          playCount: stats.playCount,
          likes: stats.likes,
          coins: stats.coins,
          favorites: stats.favorites,
          shares: stats.shares,
          comments: stats.comments,
          score,
        },
        create: {
          songId: song.id,
          date: today,
          playCount: stats.playCount,
          likes: stats.likes,
          coins: stats.coins,
          favorites: stats.favorites,
          shares: stats.shares,
          comments: stats.comments,
          score,
        },
      });

      await checkSongMilestones(song.id, stats.playCount);
      refreshed++;
    } catch (err: any) {
      failed++;
      if (failed <= 5) {
        console.log(`[Refresh] 刷新失败 ${song.bvId}: ${err.message}`);
      }
    }
  }

  await setSetting(prisma, SETTING_KEYS.refreshCursor, '');
  console.log(`[Refresh] 完成: ${refreshed} 成功, ${failed} 失败, ${skipped} 跳过, ${deletedBvIds.length} 已删除`);
  return { refreshed, failed, deletedBvIds, skipped };
}
