/**
 * 排行榜生成：只读 Song.score，写入 Ranking 快照。
 *
 * - live：当期可覆盖（自然日/周/月/年 + 总榜）
 * - final：周期结束后写入，之后不再 deleteMany
 */
import { chinaCalendarDay, chinaMonthRange, chinaWeekRange, chinaYearRange, shiftChinaDays } from '../../../lib/time';
import { cacheInvalidate } from '../../cache/memory';
import { prisma as sharedPrisma } from '../../../lib/prisma';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime';

const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'yearly', 'alltime'];
const TOP_N = 100;

function getPrisma() {
  return sharedPrisma;
}

function periodRange(period: Period, refDate: Date): { start?: Date; end?: Date; snapDate: Date } {
  switch (period) {
    case 'daily': {
      const d = chinaCalendarDay(refDate);
      return { start: d.start, end: d.end, snapDate: d.snapDate };
    }
    case 'weekly': {
      const w = chinaWeekRange(refDate);
      return { start: w.start, end: w.end, snapDate: w.snapDate };
    }
    case 'monthly': {
      const m = chinaMonthRange(refDate);
      return { start: m.start, end: m.end, snapDate: m.snapDate };
    }
    case 'yearly': {
      const y = chinaYearRange(refDate);
      return { start: y.start, end: y.end, snapDate: y.snapDate };
    }
    case 'alltime':
      return { snapDate: chinaCalendarDay(refDate).snapDate };
  }
}

export async function generateRanking(
  period: Period,
  opts: Date | { refDate?: Date; isFinal?: boolean } = {},
): Promise<number> {
  const prisma = getPrisma();
  const normalized = opts instanceof Date ? { refDate: opts, isFinal: false } : opts;
  const isFinal = normalized.isFinal ?? false;
  const refDate = normalized.refDate ?? new Date();
  const { start, end, snapDate } = periodRange(period, refDate);

  if (isFinal) {
    const existing = await prisma.ranking.findFirst({
      where: { period, date: snapDate, isFinal: true },
      select: { id: true },
    });
    if (existing) return 0;
  }

  const where: { publishTime?: { gte?: Date; lt?: Date } } = {};
  if (start) where.publishTime = { gte: start };
  if (end) where.publishTime = { ...where.publishTime, lt: end };

  const songs = await prisma.song.findMany({
    where,
    select: { id: true, score: true },
    orderBy: { score: 'desc' },
    take: TOP_N,
  });

  if (songs.length === 0) return 0;

  await prisma.ranking.deleteMany({
    where: { period, date: snapDate, isFinal },
  });

  await prisma.ranking.createMany({
    data: songs.map((s: { id: string; score: number }, i: number) => ({
      songId: s.id,
      period,
      rank: i + 1,
      score: s.score,
      date: snapDate,
      isFinal,
    })),
  });

  cacheInvalidate('rankings:');
  cacheInvalidate('homepage:');
  return songs.length;
}

export async function generateLiveRankings(refDate?: Date): Promise<Record<Period, number>> {
  const results: Record<Period, number> = { daily: 0, weekly: 0, monthly: 0, yearly: 0, alltime: 0 };
  for (const period of PERIODS) {
    results[period] = await generateRanking(period, { refDate, isFinal: false });
  }
  return results;
}

/** 兼容旧调用：生成当期 live 快照 */
export async function generateAllRankings(refDate?: Date): Promise<Record<Period, number>> {
  return generateLiveRankings(refDate);
}

/**
 * 封榜：昨日日榜、上一自然周/月/年（若已到周期结束且尚无 final）。
 * 在每天 0:30 调用。
 */
export async function generateFinalRankings(now: Date = new Date()): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const yesterday = shiftChinaDays(now, -1);
  out.daily = await generateRanking('daily', { refDate: yesterday, isFinal: true });

  const todayWeekday = chinaCalendarDay(now);
  const week = chinaWeekRange(now);
  if (todayWeekday.snapDate.getTime() === week.snapDate.getTime()) {
    const prevWeek = shiftChinaDays(week.snapDate, -7);
    out.weekly = await generateRanking('weekly', { refDate: prevWeek, isFinal: true });
  }

  const month = chinaMonthRange(now);
  if (todayWeekday.snapDate.getTime() === month.snapDate.getTime()) {
    const prevMonth = shiftChinaDays(month.snapDate, -1);
    out.monthly = await generateRanking('monthly', { refDate: prevMonth, isFinal: true });
  }

  const year = chinaYearRange(now);
  if (todayWeekday.snapDate.getTime() === year.snapDate.getTime()) {
    const prevYear = shiftChinaDays(year.snapDate, -1);
    out.yearly = await generateRanking('yearly', { refDate: prevYear, isFinal: true });
  }

  return out;
}
