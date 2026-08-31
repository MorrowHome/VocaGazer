/**
 * 评分系统
 * 绝对计数加权，再按点赞率/投币率/收藏率削减推流灌水，按评论异常削减刷评。
 */

export interface Stats {
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
}

export const SCORE_AXES = ['playCount', 'likes', 'coins', 'favorites', 'shares', 'comments'] as const;
export type ScoreAxis = (typeof SCORE_AXES)[number];

export const AXIS_LABELS: Record<ScoreAxis, string> = {
  playCount: '播放',
  likes: '点赞',
  coins: '投币',
  favorites: '收藏',
  shares: '分享',
  comments: '评论',
};

export const WEIGHTS = {
  playCount: 0.15,
  likes: 0.25,
  coins: 0.25,
  favorites: 0.20,
  shares: 0.10,
  comments: 0.05,
};

function rateOf(num: number, den: number) {
  if (den <= 0) return 0;
  return num / den;
}

/** 播放太少时不判推流，避免新曲被误伤 */
export function engagementQuality(plays: number, hits: number, good: number, ok: number, weak: number): number {
  if (plays < 500) return 1;
  const r = rateOf(hits, plays);
  if (r >= good) return 1;
  if (r >= ok) return 0.85;
  if (r >= weak) return 0.62;
  return 0.4;
}

export function commentQuality(plays: number, likes: number, comments: number): number {
  if (comments <= 0) return 1;
  if (comments > likes * 1.2 && comments > 40) return 0.4;
  const cr = rateOf(comments, plays);
  if (plays >= 1000 && cr > 0.06) return 0.5;
  if (plays >= 1000 && cr > 0.03) return 0.75;
  return 1;
}

/**
 * 计算歌曲综合评分。
 * 先按权重加总，再用互动率打折：推流（高播低赞）和刷评会拉低得分。
 */
export function calculateScore(stats: Stats): number {
  const qLike = engagementQuality(stats.playCount, stats.likes, 0.08, 0.045, 0.02);
  const qCoin = engagementQuality(stats.playCount, stats.coins, 0.02, 0.01, 0.004);
  const qFav = engagementQuality(stats.playCount, stats.favorites, 0.03, 0.015, 0.007);
  const qComment = commentQuality(stats.playCount, stats.likes, stats.comments);
  const push = Math.min(qLike, qCoin, qFav);

  return (
    stats.playCount * WEIGHTS.playCount * push +
    stats.likes * WEIGHTS.likes * qLike +
    stats.coins * WEIGHTS.coins * qCoin +
    stats.favorites * WEIGHTS.favorites * qFav +
    stats.shares * WEIGHTS.shares +
    stats.comments * WEIGHTS.comments * qComment
  );
}

/**
 * 计算所有歌曲的评分并更新数据库
 */
export async function recalculateAllScores(prisma?: any): Promise<number> {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }

  const songs = await prisma.song.findMany();
  let updated = 0;

  for (const song of songs) {
    try {
      const stats = JSON.parse(song.statistics) as Stats;
      const score = calculateScore(stats);

      await prisma.song.update({
        where: { id: song.id },
        data: { score },
      });
      updated++;
    } catch {
      continue;
    }
  }

  return updated;
}
