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

/** 排除关键词（非原创内容） */
const EXCLUDE_KEYWORDS = [
  // 榜单类
  '周榜', '月榜', '日榜', '年榜', '排行', '排名',
  '传说曲', '人气曲', '殿堂曲', '金曲',
  // 教程/攻略类
  '教程', '教学', '攻略', '入门', '入坑', '指北', '指南',
  '翻译', '中译', '日文', '日语', '罗马音', '字幕',
  // 翻唱/翻调类
  '翻唱', '翻填', '翻作',
  'remix', 'remaster', 'cover',
  'カバー',           // 日语"翻唱"
  // 填词翻唱
  '填词',
  // 谱面/游戏类
  '自制谱', '谱面', '谱子', 'PJSK', 'project sekai',
  // 片段/试唱
  '一小段', '试唱',
  // 演唱会/活动类
  '演唱会', '祭',
  // 盘点/合集类
  '盘点', '合集', '合辑', '精选', '专辑',
  '手办', 'MAD', 'MMD', '3D', '建模', '手书',
  // 完整版/长篇类（如 JoJo 完整版剪辑、电影等）
  '完整版', '全集', '全话', '全篇',
  // 真人化/实写类
  '真人', '实写', '实写化', '真人版', '真人化',
  // 动画/影视类非歌曲
  '片头', '片尾', '主题曲',
  'BGM', 'OST', '原声', '原声带',
  '插曲', '配乐', '纯音乐', 'instrumental',
  // 知名动漫名（大概率不是VOCALOID曲）
  'jojo', 'JoJo',
  '鬼灭', '咒术', '海贼', '火影', '死神',
  '龙珠', '灌篮高手', '进击的巨人', 'EVA',
  '间谍过家家', '葬送的芙莉莲', '我推的孩子',
  '原神', '崩坏', '星穹铁道', '方舟', '碧蓝',
  // 影视类
  '电影', '影视', '电视剧', '综艺', '纪录片',
  // 实况/Vlog类
  'Vlog', 'vlog', '日常', '记录',
  // 游戏实况
  '游戏', '实况', '直播', '录播',
];

/** 原创判定关键词 */
const ORIGINAL_KEYWORDS = [
  '原创', '作曲', '编曲', '作词',
  'VOCALOID原曲', '术力口原曲',
  '自制', '自制曲', '本家', '个人制作',
  '调声', '混音', '作曲编曲',
];

/** 描述中出现的原创特征（标题不必包含原创字眼） */
const DESCRIPTION_ORIGINAL_HINTS = [
  '作曲', '编曲', '作词', '调声',
  'producer', 'produced by',
  'music by', 'lyrics by',
];

/** VOCALOID 角色/引擎标签（用于验证视频是否真的和VOCALOID相关） */
const VOCALOID_TAGS = [
  // 日语
  'vocaloid', 'VOCALOID', 'ボーカロイド',
  '初音ミク', '初音未来', 'miku', '初音',
  '鏡音リン', '镜音铃', '镜音连', '鏡音レン',
  '巡音ルカ', '巡音流歌', 'luka',
  'MEIKO', 'KAITO',
  // 中文
  '洛天依', '言和', '乐正绫', '乐正龙牙',
  '徵羽摩柯', '墨清弦',
  // Synthesizer V / ACE
  '星尘', '星塵', 'infinity', '心华',
  '赤羽', '苍穹', '诗岸', '海伊', '永夜', '永夜minus', 'Minus', '艾可',
  '小春六花', '夏色花梨', '花隈千冬',
  // 其他常见VOCALOID/UTAU歌手
  'GUMI', 'flower', '重音テト',
  '音街ウナ', '歌愛ユキ',
  // 引擎
  'synthesizer v', 'Synthesizer V',
  'UTAU', 'CeVIO', 'VOICEVOX',
  'NEUTRINO', 'NAKOTALK',
  // 通用
  '术力口', 'ボカロ', 'vocaloid中文',
];

// ========== 过滤逻辑 ==========

function shouldExclude(title: string, description: string): boolean {
  // 只检查标题。描述包含歌词/元数据, 误报率太高
  return EXCLUDE_KEYWORDS.some((kw) => title.toLowerCase().includes(kw.toLowerCase()));
}

/**
 * 检查描述中是否指向他人作品的翻调/翻唱
 * 例如：本家：BV1Y2oNB1ESs、本家: xxx、原曲：xxx
 */
function isCoverOfAnotherWork(description: string): boolean {
  const desc = description || '';
  // 本家 + BV号 = 基于他人作品的翻调
  if (/本家\s*[:：]\s*BV/i.test(desc)) return true;
  // 原曲 + BV号
  if (/原曲\s*[:：]\s*BV/i.test(desc)) return true;
  // 站内本家
  if (/站内本家/i.test(desc)) return true;
  return false;
}

function isOriginal(title: string, description: string): boolean {
  if (shouldExclude(title, description)) return false;

  // 指向他人作品的翻调 → 排除
  if (isCoverOfAnotherWork(description)) return false;

  const combined = `${title} ${description}`;
  const desc = description || '';

  // 标题包含明确的原创标识
  if (ORIGINAL_KEYWORDS.some((kw) => title.includes(kw))) return true;

  // 描述中出现作曲/编曲等创作相关词汇（强信号）
  if (DESCRIPTION_ORIGINAL_HINTS.some((kw) => desc.toLowerCase().includes(kw))) {
    return true;
  }

  // 全文包含原创关键词
  if (ORIGINAL_KEYWORDS.some((kw) => combined.includes(kw))) return true;

  // 默认不认定为原创（宁可漏过也不要误判）
  return false;
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
  const prisma = getPrisma();

  for (const v of originalVideos) {
    try {
      const detail = await getVideoDetail(v.bvid);
      if (!detail) continue;

      // 二级过滤：检查时长（VOCALOID 歌曲通常在 90s~12min）
      const duration = detail.duration;
      if (duration < 60 || duration > 900) {
        log(`  排除（时长异常 ${duration}s）: ${v.title}`);
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

      // 检查里程碑
      await checkSongMilestones(song.id, songData.statistics.playCount);

      savedCount++;
      await delay(requestDelay);
    } catch (err: any) {
      errors.push(`${v.bvid}: ${err.message}`);
    }
  }

  log(`入库完成，成功保存 ${savedCount} 首，失败 ${errors.length} 首`);
  return { totalVideos, originalCount: originalVideos.length, savedCount, errors };
}
