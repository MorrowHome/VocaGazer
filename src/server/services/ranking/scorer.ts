/**
 * 评分系统
 * 根据 SPEC.md 3.2 节定义的加权综合评分算法
 */

interface Stats {
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
}

// 权重配置 (SPEC 3.2)
const WEIGHTS = {
  playCount: 0.15,
  likes: 0.25,
  coins: 0.25,
  favorites: 0.20,
  shares: 0.10,
  comments: 0.05,
};

/**
 * 计算歌曲综合评分
 * Score = (P × Wp) + (L × Wl) + (C × Wc) + (F × Wf) + (Sh × Wsh) + (T × Wt)
 */
export function calculateScore(stats: Stats): number {
  return (
    stats.playCount * WEIGHTS.playCount +
    stats.likes * WEIGHTS.likes +
    stats.coins * WEIGHTS.coins +
    stats.favorites * WEIGHTS.favorites +
    stats.shares * WEIGHTS.shares +
    stats.comments * WEIGHTS.comments
  );
}

/**
 * 计算所有歌曲的评分并更新数据库
 */
export async function recalculateAllScores(): Promise<number> {
  const { prisma } = await import('@/lib/prisma');

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
