/**
 * 排行榜生成服务
 * 基于歌曲发布时间过滤 + 当前评分生成排行榜快照
 *
 * 周期含义：
 * - daily:   发布在最近 1  天内的歌曲参与排名
 * - weekly:  发布在最近 7  天内的歌曲参与排名
 * - monthly: 发布在最近 30 天内的歌曲参与排名
 * - yearly:  发布在最近 365 天内的歌曲参与排名
 * - alltime: 所有歌曲参与排名
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

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime';

/**
 * 根据周期和参考日期计算歌曲的发布时间过滤范围
 * @param period  排名周期
 * @param refDate 参考日期（默认当前时间），用于"当年某月某日的排行"查询
 */
/** Convert a Date to China-timezone midnight UTC */
function chinaMidnight(date: Date): Date {
  const chinaStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const [y, m, d] = chinaStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function getDateRange(period: Period, refDate: Date = new Date()): { start?: Date } {
  const ref = chinaMidnight(refDate);

  switch (period) {
    case 'daily': {
      const start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      return { start };
    }
    case 'weekly': {
      const start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 7);
      return { start };
    }
    case 'monthly': {
      const start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      start.setMonth(start.getMonth() - 1);
      return { start };
    }
    case 'yearly': {
      const start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      start.setFullYear(start.getFullYear() - 1);
      return { start };
    }
    case 'alltime':
      return {};
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
 * @param period  周期
 * @param refDate 参考日期（可选），用于生成历史快照
 */
export async function generateRanking(period: Period, refDate?: Date): Promise<number> {
  const prisma = await getPrisma();

  // 根据周期过滤歌曲的发布时间范围
  const { start } = getDateRange(period, refDate);
  const where = start ? { publishTime: { gte: start } } : {};

  const songs = await prisma.song.findMany({ where });

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

  // 快照日期：中国时区的 refDate 当天（或今天）
  const snapDate = refDate ? chinaMidnight(refDate) : new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  );

  // 只清空该日期的旧排行数据（保留其他日期的历史快照）
  await prisma.ranking.deleteMany({
    where: { period, date: snapDate },
  });

  // 批量插入新排行
  const data = ranked.map((r: any, i: number) => ({
    songId: r.songId,
    period,
    rank: i + 1,
    score: r.score,
    date: snapDate,
  }));

  await prisma.ranking.createMany({ data });
  return data.length;
}

/**
 * 生成所有周期的排行榜
 * @param refDate 参考日期（可选）
 */
export async function generateAllRankings(refDate?: Date): Promise<Record<Period, number>> {
  const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly', 'alltime'];
  const results: Record<Period, number> = { daily: 0, weekly: 0, monthly: 0, yearly: 0, alltime: 0 };

  for (const period of periods) {
    results[period] = await generateRanking(period, refDate);
  }

  return results;
}
