/**
 * B站 VOCALOID 歌曲采集服务
 */
import { PrismaClient } from '@prisma/client';
import { searchByKeyword, getVideoDetail, delay } from './client';
import { calculateScore } from '../ranking/scorer';
import { checkSongMilestones } from '../milestone';
import type { SongData } from './types';

// 避免动态 import('@/lib/prisma') 在 tsx 运行时不解析 @/ 别名
let _prisma: PrismaClient | null = null;
function getPrisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

// ========== 配置 ==========

/** 搜索用标签列表 - 只保留歌姬名和明确指向歌曲的标签 */
const TAGS = [
  // 核心歌曲标签（引导搜索聚焦于歌曲而非教程/软件）
  'VOCALOID原创', '术力口原创', '虚拟歌手原创',
  'VOCALOID曲', '术力口曲', 'VOCALOID中文曲',
  'VOCALOID', '虚拟歌手', '术力口',

  // 中文VOCALOID 主流
  '洛天依', '洛天依原创', '言和', '言和原创',
  '乐正绫', '乐正绫原创', '乐正龙牙',
  '徵羽摩柯', '墨清弦',

  // 中文 Synthesizer V / ACE
  '星尘', '星尘infinity', '心华',
  '赤羽', '苍穹', '诗岸', '海伊',
  '永夜minus', 'Minus', '艾可',

  // 日语VOCALOID
  '初音未来', '初音未来原创',
  '镜音铃', '镜音连', '巡音流歌',
  'MEIKO', 'KAITO',
  'GUMI', 'flower', '重音テト',
  '音街ウナ',

  // Synthesizer V AI 歌手
  '小春六花', '夏色花梨', '花隈千冬',
];

// ========== 评分制过滤 ==========

/**
 * 硬排除关键词——出现即排除，即使标题含 V 家角色名
 * 这些模式明确表示非原创歌曲内容
 */
const HARD_EXCLUDE = [
  // 入驻/自我介绍
  '入驻B站', '入驻b站', '入驻 b站',
  '大家好', '自我介绍', '个人介绍',
  // 翻调/翻配/翻唱（非原创）
  '翻调', '翻配',
  '翻唱', '翻填', '翻作',
  'remaster',
  'カバー',
  // 商业推广
  '开箱', '联名', '首发',
  '手表', '播放器', '耳机',
  // 频道推广
  '最新视频已上线', '快来围观',
  // 游戏（非音乐）
  '周五夜放克',
  '周五夜',
  '_bgt_',  // 自动生成水印
  // 纯动画/影视
  'MAD', 'AMV',
  '手书',
  '模型', '手办',
  // 教程
  '教程', '教学', '攻略',
  '入门', '入坑',
  '翻译', '中译', '字幕',
  // 榜单
  '周榜', '月榜', '日榜',
  '排行', '排名',
  // 实况直播
  '实况', '直播', '录播',
  // 盘点
  '盘点', '合集', '合辑', '精选',
  '全集', '完整版',
  // 片段
  '一小段', '试唱',
  // 纯演奏/纯音乐
  '纯音乐', 'instrumental', 'BGM',
  '原声', '原声带', '配乐',
  // 非音乐场景：游戏/电竞/品牌
  '安徽星尘', '星尘希儿', '星尘十字军', '星尘列车',
  '测试服', '体验服',
  '卡面剧情',
  '全连', '存活所有',
  '电竞', '纪录片',
  '吸尘器', '扭腰舞',
  'WOTA艺', 'wota艺',
  '明末', 'PS5PRO',
].sort((a, b) => b.length - a.length); // 长词优先

/**
 * 商业/非音乐关键词——含这些关键词且没有原创证据时排除
 */
const SOFT_EXCLUDE = [
  'Vlog', 'vlog', '日常', '记录',
  '本命', '我推', '推し',
  '填词',
  'cover', 'Cover',
  '原创曲',  // "非歌曲原创" 类
  '片头', '片尾',
  '谱面', '谱子', '自制谱', 'PJSK',
  '真人', '实写',
  '祭',
  '演唱会',
  '主题曲',
  '插曲',
  '纯伴奏',
  'PV', 'pv',
  '生贺',  // 生日祝贺视频（不是歌）
  '开箱',
  'MMD', 'mmd',
  '动画', '动漫',
];

/** 原创证据关键词——标题含这些的几乎肯定是原创歌 */
const STRONG_ORIGINAL = [
  '原创', '作曲', '编曲', '作词',
  'VOCALOID原曲', '术力口原曲',
  '自制曲', '本家',
  '个人制作',
  '调声', '混音',
  'producer', 'produced by',
];

/** 描述中的原创信号 */
const DESC_ORIGINAL_SIGNALS = [
  '作曲', '编曲', '作词', '调声',
  'producer', 'produced by',
  'music by', 'lyrics by',
  'VOCALOID', 'vocaloid',
  '调教', '演唱', '歌手', 'vocal', 'feat',
  'vo:', 'vo：', 'vo。', 'vo.',
  '音楽', '作詞', '編曲',
];

/** 已知非音乐的媒体/品牌名（含 V 角色名关键词时的误判防护） */
const KNOWN_NON_MUSIC = [
  '苍穹', // 可能指游戏"苍穹"而非歌姬
  '艾可瑞', // 换热器品牌
  '斗破苍穹',
  '苍穹的法芙娜',
];

/** VOCALOID 角色/引擎标签 */
const VOCALOID_TAGS = [
  'vocaloid', 'VOCALOID', 'ボーカロイド',
  '初音ミク', '初音未来', 'miku', '初音',
  '鏡音リン', '镜音铃', '镜音连', '鏡音レン',
  '巡音ルカ', '巡音流歌', 'luka',
  'MEIKO', 'KAITO',
  '洛天依', '言和', '乐正绫', '乐正龙牙',
  '徵羽摩柯', '墨清弦',
  '星尘', '星塵', 'infinity', '心华',
  '赤羽', '苍穹', '诗岸', '海伊', '永夜', '永夜minus', 'Minus', '艾可',
  '小春六花', '夏色花梨', '花隈千冬',
  'GUMI', 'flower', '重音テト',
  '音街ウナ', '歌愛ユキ',
  'synthesizer v', 'Synthesizer V',
  'UTAU', 'CeVIO', 'VOICEVOX',
  'NEUTRINO', 'NAKOTALK',
  '术力口', 'ボカロ', 'vocaloid中文',
];

/**
 * 评分制原创判定
 * 返回 { isOriginal: boolean, score: number, reason: string }
 */
export function judgeOriginality(
  title: string,
  description: string,
  duration?: number,
): { isOriginal: boolean; score: number; reason: string } {
  const titleLow = title.toLowerCase();
  const desc = (description || '').toLowerCase();
  const combined = `${titleLow} ${desc}`;

  // ── 硬排除（一票否决）──
  for (const kw of HARD_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) {
      return { isOriginal: false, score: -100, reason: `硬排除: "${kw}"` };
    }
  }

  // ── 时长过滤（过短或过长的大概率不是歌）──
  if (duration !== undefined && duration > 0) {
    if (duration < 30 || duration > 900) {
      return { isOriginal: false, score: -80, reason: `时长异常: ${duration}s` };
    }
  }

  // ── 检查是否指向他人的翻调──
  if (/本家\s*[:：]\s*BV/i.test(desc)) {
    return { isOriginal: false, score: -90, reason: '描述含本家+BV' };
  }
  if (/原曲\s*[:：]\s*BV/i.test(desc)) {
    return { isOriginal: false, score: -90, reason: '描述含原曲+BV' };
  }
  if (/站内本家/i.test(desc)) {
    return { isOriginal: false, score: -90, reason: '描述含站内本家' };
  }

  // 检查是否提到 V 家角色
  const mentionsChar = VOCALOID_TAGS.some((vt) => titleLow.includes(vt.toLowerCase()));

  // 非 V 家内容直接排除
  if (!mentionsChar) {
    return { isOriginal: false, score: -50, reason: '标题无 V 家角色名' };
  }

  // ── 已知非音乐关键词排除 ──
  for (const nm of KNOWN_NON_MUSIC) {
    if (titleLow.includes(nm.toLowerCase()) && !desc.includes('作曲') && !desc.includes('原创')) {
      return { isOriginal: false, score: -70, reason: `非音乐信号: "${nm}"` };
    }
  }

  // ── 强原创信号 ──
  for (const kw of STRONG_ORIGINAL) {
    if (title.includes(kw)) {
      return { isOriginal: true, score: 100, reason: `强原创: "${kw}"` };
    }
  }

  // ── 计分 ──
  let score = 0;

  // 正信号：标题提到 V 家角色
  score += 20;

  // 正信号：时长在合理范围（60-480s 是典型歌长）
  if (duration && duration >= 60 && duration <= 480) {
    score += 15;
  }

  // 正信号：描述有作曲/编曲等
  if (DESC_ORIGINAL_SIGNALS.some((s) => desc.includes(s))) {
    score += 25;
  }

  // 正信号：描述有 #VOCALOID# 等标签
  if (description && description.includes('VOCALOID')) {
    score += 10;
  }

  // 负信号：软的商业/非音乐关键词
  for (const kw of SOFT_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) {
      score -= 20;
    }
  }

  // 负信号：描述没有音乐相关词
  const hasAnyMusicSignal = STRONG_ORIGINAL.some((k) => combined.includes(k.toLowerCase()))
    || DESC_ORIGINAL_SIGNALS.some((s) => combined.includes(s))
    || combined.includes('VOCALOID')
    || combined.includes('歌');
  if (!hasAnyMusicSignal) {
    score -= 30;
  }

  // ── 决策 ──
  if (score >= 25) {
    return { isOriginal: true, score, reason: `得分 ${score}` };
  }
  return { isOriginal: false, score, reason: `得分不足 ${score}` };
}

/** 歌曲分类检测 */
const REMIX_KEYWORDS = ['remix', 'Remix', 'REMIX', 'Rearrange', 'rearrange'];
const COVER_KEYWORDS = ['翻唱', '翻填', 'cover', 'Cover', 'COVER', 'カバー', '翻调'];

function detectCategory(title: string, description: string): string {
  const text = `${title} ${description}`;
  if (REMIX_KEYWORDS.some((kw) => text.includes(kw))) return 'remix';
  if (COVER_KEYWORDS.some((kw) => text.includes(kw))) return 'cover';
  return 'original';
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
  skipped?: boolean;
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
  const prisma = getPrisma();

  const enabled = await prisma.setting.findUnique({ where: { key: 'crawl_enabled' } });
  if (enabled?.value === 'false') {
    log('采集已关闭（crawl_enabled=false），跳过');
    return { totalVideos: 0, originalCount: 0, savedCount: 0, errors: [], skipped: true };
  }

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

  // 阶段 2：原创筛选（评分制）
  const originalVideos = Array.from(videoMap.values()).filter((v) => {
    const judgment = judgeOriginality(v.title, v.description);
    if (verbose && !judgment.isOriginal) {
      log(`  排除: ${v.title.substring(0, 40)} → ${judgment.reason}`);
    }
    return judgment.isOriginal;
  });
  log(`原创筛选完成，共 ${originalVideos.length} 个可能原创视频`);

  // 阶段 3：获取详情并入库
  let savedCount = 0;

  for (const v of originalVideos) {
    try {
      const detail = await getVideoDetail(v.bvid);
      if (!detail) continue;

      // 二级过滤：带时长数据的二次判定
      const judgment = judgeOriginality(v.title, v.description, detail.duration);
      if (!judgment.isOriginal) {
        log(`  二级排除: ${v.title.substring(0, 40)} → ${judgment.reason}`);
        continue;
      }
      // 二级过滤：检查标签是否包含 VOCALOID 相关标签
      // 但如果标题/描述中已明确提到 VOCALOID 角色名或引擎，则跳过标签检查
      const titleDesc = `${v.title} ${v.description}`;
      const mentionsVocaloidChar = VOCALOID_TAGS.some((vt) =>
        titleDesc.toLowerCase().includes(vt.toLowerCase()),
      );

      if (!mentionsVocaloidChar) {
        const hasVocaloidTag = detail.tags?.some((t: string) =>
          VOCALOID_TAGS.some((vt) => t.toLowerCase().includes(vt.toLowerCase())),
        );
        if (!hasVocaloidTag) {
          log(`  排除（标题无角色名+无VOCALOID标签）: ${v.title}`);
          continue;
        }
      }

      const songData: SongData = {
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

      // 计算评分
      const score = calculateScore(songData.statistics);

      // upsert：已存在则更新统计数据
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

      // 检查里程碑
      await checkSongMilestones(song.id, songData.statistics.playCount);

      // 保存每日统计快照（按中国时区）
      const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }));
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

      // 更新歌曲分类
      const category = detectCategory(songData.title, songData.description || '');
      if (song.category !== category) {
        await prisma.song.update({
          where: { id: song.id },
          data: { category },
        });
      }

      savedCount++;
      await delay(requestDelay);
    } catch (err: any) {
      errors.push(`${v.bvid}: ${err.message}`);
    }
  }

  log(`入库完成，成功保存 ${savedCount} 首，失败 ${errors.length} 首`);

  await prisma.setting.upsert({
    where: { key: 'last_crawl_time' },
    update: { value: new Date().toISOString() },
    create: { key: 'last_crawl_time', value: new Date().toISOString() },
  });

  return { totalVideos, originalCount: originalVideos.length, savedCount, errors };
}

/**
 * 刷新所有已有歌曲的统计数据
 * 遍历全部歌曲，从 B 站拉取最新数据并更新
 * 为播放量趋势图提供数据积累
 */
export async function refreshAllSongs(
  options: { requestDelay?: number; batchSize?: number } = {}
): Promise<{ refreshed: number; failed: number; deletedBvIds: string[] }> {
  const { requestDelay = 500, batchSize = 20 } = options;
  const prisma = getPrisma();

  const allSongs = await prisma.song.findMany({
    select: { id: true, bvId: true, title: true },
    orderBy: { updatedAt: 'asc' }, // 最后更新的优先刷新
  });

  console.log(`[Refresh] 共 ${allSongs.length} 首歌需要刷新`);

  let refreshed = 0;
  let failed = 0;
  const deletedBvIds: string[] = [];

  for (let i = 0; i < allSongs.length; i++) {
    const song = allSongs[i];
    if (i > 0 && i % batchSize === 0) {
      console.log(`[Refresh] 进度 ${i}/${allSongs.length}`);
    }

    try {
      const detail = await getVideoDetail(song.bvId);
      await delay(requestDelay);

      if (!detail) {
        // 视频已删除或下架
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

      // 保存每日快照（按中国时区）
      const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }));
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

      // 检查里程碑
      await checkSongMilestones(song.id, stats.playCount);

      refreshed++;
    } catch (err: any) {
      failed++;
      if (failed <= 5) {
        console.log(`[Refresh] 刷新失败 ${song.bvId}: ${err.message}`);
      }
    }
  }

  console.log(`[Refresh] 完成: ${refreshed} 成功, ${failed} 失败, ${deletedBvIds.length} 已删除`);
  return { refreshed, failed, deletedBvIds };
}
