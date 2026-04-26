/**
 * B站 VOCALOID 歌曲采集服务
 */
import { searchByKeyword, getVideoDetail, delay } from './client';
import { calculateScore } from '../ranking/scorer';
import type { SongData } from './types';

// ========== 配置 ==========

/** 搜索用标签列表 */
const TAGS = [
  'VOCALOID', '虚拟歌手', '术力口',
  '洛天依', '言和', '乐正绫', '星尘',
  '镜音铃', '镜音连', '初音未来', '巡音流歌',
  'GUMI', '墨清弦', '乐正龙牙', '徵羽摩柯',
  'VOCALOID曲', 'VOCALOID中文曲', '术力口曲',
];

/** 排除关键词（非原创内容） */
const EXCLUDE_KEYWORDS = [
  '周榜', '月榜', '日榜', '年榜', '排行', '排名',
  '传说曲', '人气曲', '殿堂曲', '金曲',
  '教程', '教学', '攻略', '入门', '入坑', '指北', '指南',
  '翻译', '中译', '日文', '日语', '罗马音', '字幕',
  '翻唱', '翻填', '翻作',
  'remix', 'remaster', 'cover',
  '演唱会', '祭',
  '盘点', '合集', '合辑', '精选', '专辑',
  '手办', 'MAD', 'MMD', '3D', '建模', '手书',
];

/** 原创判定关键词 */
const ORIGINAL_KEYWORDS = [
  '原创', '作曲', '编曲', '作词',
  'VOCALOID原曲', '术力口原曲',
  '自制', '自制曲', '本家', '个人制作',
];

/** 可能原创的关键词 */
const LIKELY_ORIGINAL_KEYWORDS = [
  'feat.', 'feat ', 'ft.', 'ft ',
  ' / ', ' - ', '　',
];

// ========== 过滤逻辑 ==========

function shouldExclude(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return EXCLUDE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

function isOriginal(title: string, description: string): boolean {
  const text = `${title} ${description}`;
  if (shouldExclude(title, description)) return false;

  const hasOriginal = ORIGINAL_KEYWORDS.some((kw) => text.includes(kw));
  const hasLikely = LIKELY_ORIGINAL_KEYWORDS.some((kw) => text.includes(kw));
  return hasOriginal || hasLikely;
}

// ========== 采集主逻辑 ==========

export interface CrawlOptions {
  /** 仅采集最近几小时内发布的视频（默认 72 小时） */
  withinHours?: number;
  /** 请求之间延迟毫秒数（默认 500ms，避免被限） */
  requestDelay?: number;
  /** 搜索标签列表（覆盖默认） */
  tags?: string[];
  /** 是否输出详细日志 */
  verbose?: boolean;
}

export interface CrawlResult {
  totalVideos: number;
  originalCount: number;
  savedCount: number;
  errors: string[];
}

/**
 * 执行一次增量采集
 * @returns 采集结果统计
 */
export async function runCrawl(
  options: CrawlOptions = {},
): Promise<CrawlResult> {
  const {
    withinHours = 168,
    requestDelay = 500,
    tags = TAGS,
    verbose = false,
  } = options;

  const log = verbose ? console.log : () => {};
  const errors: string[] = [];

  // 时间过滤：只保留最近 N 小时的视频
  const since = Date.now() / 1000 - withinHours * 3600;

  // 去重映射
  const videoMap = new Map<
    string,
    {
      bvid: string;
      title: string;
      author: string;
      pubdate: number;
      description: string;
      matchedTags: string[];
    }
  >();

  // 阶段 1：标签搜索 + 去重
  log(`开始搜索 ${tags.length} 个标签，过滤 ${withinHours}h 内的视频...`);

  for (const tag of tags) {
    const videos = await searchByKeyword(tag);
    for (const v of videos) {
      if (v.pubdate < since) continue;

      if (videoMap.has(v.bvid)) {
        const existing = videoMap.get(v.bvid)!;
        if (!existing.matchedTags.includes(tag)) {
          existing.matchedTags.push(tag);
        }
      } else {
        videoMap.set(v.bvid, {
          bvid: v.bvid,
          title: v.title,
          author: v.author,
          pubdate: v.pubdate,
          description: v.description,
          matchedTags: [tag],
        });
      }
    }
    await delay(requestDelay);
  }

  const totalVideos = videoMap.size;
  log(`搜索完成，共去重后 ${totalVideos} 个视频`);

  // 阶段 2：原创筛选
  const originalVideos = Array.from(videoMap.values()).filter((v) =>
    isOriginal(v.title, v.description),
  );
  log(`原创筛选完成，共 ${originalVideos.length} 个可能原创视频`);

  // 阶段 3：获取详情并入库
  let savedCount = 0;
  const { prisma } = await import('@/lib/prisma');

  for (const v of originalVideos) {
    try {
      const detail = await getVideoDetail(v.bvid);
      if (!detail) continue;

      const songData: SongData = {
        bvId: detail.bvid,
        title: detail.title,
        author: detail.author,
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

      // 计算评分
      const score = calculateScore(songData.statistics);

      // upsert：已存在则更新统计数据
      await prisma.song.upsert({
        where: { bvId: songData.bvId },
        update: {
          statistics: JSON.stringify(songData.statistics),
          tags: JSON.stringify(songData.tags),
          description: songData.description,
          score,
        },
        create: {
          bvId: songData.bvId,
          title: songData.title,
          author: songData.author,
          publishTime: songData.publishTime,
          description: songData.description,
          duration: songData.duration,
          picUrl: songData.picUrl,
          tags: JSON.stringify(songData.tags),
          statistics: JSON.stringify(songData.statistics),
          score,
        },
      });

      savedCount++;
      await delay(requestDelay);
    } catch (err: any) {
      errors.push(`${v.bvid}: ${err.message}`);
    }
  }

  log(`入库完成，成功保存 ${savedCount} 首，失败 ${errors.length} 首`);
  return { totalVideos, originalCount: originalVideos.length, savedCount, errors };
}
