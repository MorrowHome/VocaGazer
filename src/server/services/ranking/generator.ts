/**
 * 排行榜生成服务
 * 基于歌曲发布时间过滤 + 当前评分生成排行榜快照
 *
 * 周期含义（中国日历）：
 * - daily:   参考日当天 00:00–24:00 发布的歌曲
 * - weekly:  参考日前 7 天（含当天）
 * - monthly: 参考日前 30 天
 * - yearly:  参考日前 365 天
 * - alltime: 所有歌曲
 */
import { calculateScore } from './scorer';
import { chinaCalendarDay, shiftChinaDays } from '../../../lib/time';

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
function getDateRange(period: Period, refDate: Date = new Date()): { start?: Date; end?: Date; snapDate: Date } {
  const day = chinaCalendarDay(refDate);

  switch (period) {
    case 'daily':
      return { start: day.start, end: day.end, snapDate: day.snapDate };
    case 'weekly': {
      const from = chinaCalendarDay(shiftChinaDays(refDate, -7));
      return { start: from.start, end: day.end, snapDate: day.snapDate };
    }
    case 'monthly': {
      const from = chinaCalendarDay(shiftChinaDays(refDate, -30));
      return { start: from.start, end: day.end, snapDate: day.snapDate };
    }
    case 'yearly': {
      const from = chinaCalendarDay(shiftChinaDays(refDate, -365));
      return { start: from.start, end: day.end, snapDate: day.snapDate };
    }
    case 'alltime':
      return { snapDate: day.snapDate };
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
  const { start, end, snapDate } = getDateRange(period, refDate ?? new Date());
  const where: any = {};
  if (start) where.publishTime = { gte: start };
  if (end) where.publishTime = { ...where.publishTime, lt: end };

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
