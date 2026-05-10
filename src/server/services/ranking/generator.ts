/**
 * 排行榜生成服务
 * 根据评分数据生成日/周/月/总榜快照
 */
import { calculateScore } from './scorer';

interface Stats {
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'alltime';

function getDateRange(period: Period): { gte: Date; lt: Date } {
  const now = new Date();

  switch (period) {
    case 'daily': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { gte: start, lt: end };
    }
    case 'weekly': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { gte: start, lt: now };
    }
    case 'monthly': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { gte: start, lt: now };
    }
    case 'alltime':
      return { gte: new Date(0), lt: now };
  }
}

/**
 * 获取 Prisma 实例（避免 @/ 别名在 tsx 下不解析）
 */
let _prisma: any = null;
async function getPrisma() {
  if (!_prisma) {
    const { PrismaClient } = await import('@prisma/client');
    _prisma = new PrismaClient();
  }
  return _prisma;
}

/**
 * 生成指定周期的排行榜
 */
export async function generateRanking(period: Period): Promise<number> {
  const prisma = await getPrisma();
  const { gte } = getDateRange(period);

  // 获取周期内的歌曲
  const songs = await prisma.song.findMany({
    where: period === 'alltime' ? {} : { publishTime: { gte } },
  });

  // 计算每首歌的当前评分
  const ranked = songs
    .map((song: any) => {
      try {
        const stats = JSON.parse(song.statistics) as Stats;
        const score = calculateScore(stats);
        return { songId: song.id, score, bvId: song.bvId };
      } catch {
        return null;
      }
    })
    .filter((s: any): s is NonNullable<any> => s !== null)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 100);

  if (ranked.length === 0) return 0;

  const now = new Date();
  const dateKey = new Date(now);
  dateKey.setHours(0, 0, 0, 0);

  // 清空该周期当日的旧排行数据
  await prisma.ranking.deleteMany({
    where: { period, date: { gte: dateKey } },
  });

  // 批量插入新排行
  const data = ranked.map((r: any, i: number) => ({
    songId: r.songId,
    period,
    rank: i + 1,
    score: r.score,
    date: dateKey,
  }));

  await prisma.ranking.createMany({ data });
  return data.length;
}

/**
 * 生成所有周期的排行榜
 */
export async function generateAllRankings(): Promise<Record<Period, number>> {
  const periods: Period[] = ['daily', 'weekly', 'monthly', 'alltime'];
  const results: Record<Period, number> = { daily: 0, weekly: 0, monthly: 0, alltime: 0 };

  for (const period of periods) {
    results[period] = await generateRanking(period);
  }

  return results;
}
