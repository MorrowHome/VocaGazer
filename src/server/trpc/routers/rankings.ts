/**
 * 排行榜 tRPC 路由 — 只读 Ranking 快照 + 短 TTL
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { RANKING_CACHE_TTL_MS, cacheGet, cacheSet } from '../../cache/memory';
import {
  chinaCalendarDay,
  chinaISOWeek,
  chinaMonthRange,
  chinaYearRange,
  parseChinaISOWeek,
} from '@/lib/time';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'alltime'] as const;
type Period = (typeof PERIODS)[number];

const SONG_INCLUDE = {
  song: true,
} as const;

async function findFinalOrLatest(
  prisma: any,
  period: string,
  snapDate: Date,
) {
  const finalRows = await prisma.ranking.findMany({
    where: { period, date: snapDate, isFinal: true },
    orderBy: { rank: 'asc' },
    include: SONG_INCLUDE,
  });
  if (finalRows.length) return finalRows;

  return prisma.ranking.findMany({
    where: { period, date: snapDate },
    orderBy: { rank: 'asc' },
    include: SONG_INCLUDE,
  });
}

async function latestSnapshot(prisma: any, period: string, preferFinal: boolean) {
  if (preferFinal) {
    const finalDate = await prisma.ranking.findFirst({
      where: { period, isFinal: true },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (finalDate) {
      return prisma.ranking.findMany({
        where: { period, date: finalDate.date, isFinal: true },
        orderBy: { rank: 'asc' },
        include: SONG_INCLUDE,
      });
    }
  }
  const liveDate = await prisma.ranking.findFirst({
    where: { period, isFinal: false },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  if (liveDate) {
    return prisma.ranking.findMany({
      where: { period, date: liveDate.date, isFinal: false },
      orderBy: { rank: 'asc' },
      include: SONG_INCLUDE,
    });
  }
  const anyDate = await prisma.ranking.findFirst({
    where: { period },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  if (!anyDate) return [];
  return prisma.ranking.findMany({
    where: { period, date: anyDate.date },
    orderBy: { rank: 'asc' },
    include: SONG_INCLUDE,
  });
}

export const rankingsRouter = router({
  get: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
        limit: z.number().min(1).max(100).default(100),
        date: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { period, limit, date } = input;
      const cacheKey = `rankings:get:${period}:${date ?? 'latest'}:${limit}`;
      const cached = cacheGet<unknown[]>(cacheKey);
      if (cached) return cached;

      let rows: unknown[] = [];

      if (date && period === 'weekly') {
        const parsed = parseChinaISOWeek(date);
        if (parsed) {
          rows = await findFinalOrLatest(ctx.prisma, period, parsed.snapDate);
        }
      } else if (date && period === 'monthly') {
        const [y, m] = date.split('-').map(Number);
        if (y && m) {
          const snap = chinaMonthRange(new Date(Date.UTC(y, m - 1, 15)));
          rows = await findFinalOrLatest(ctx.prisma, period, snap.snapDate);
        }
      } else if (date && period === 'yearly') {
        const y = parseInt(date, 10);
        if (y) {
          const snap = chinaYearRange(new Date(Date.UTC(y, 6, 1)));
          rows = await findFinalOrLatest(ctx.prisma, period, snap.snapDate);
        }
      } else if (date && period === 'daily') {
        const [y, m, d] = date.split('-').map(Number);
        const target = chinaCalendarDay(new Date(Date.UTC(y, m - 1, d)));
        rows = await findFinalOrLatest(ctx.prisma, period, target.snapDate);
      } else {
        rows = await latestSnapshot(ctx.prisma, period, false);
      }

      const sliced = (rows as unknown[]).slice(0, limit);
      cacheSet(cacheKey, sliced, RANKING_CACHE_TTL_MS);
      return sliced;
    }),

  getSummary: publicProcedure.query(async ({ ctx }) => {
    const cacheKey = 'rankings:summary';
    const cached = cacheGet<Record<string, unknown[]>>(cacheKey);
    if (cached) return cached;

    const periods = ['daily', 'weekly', 'monthly'] as const;
    const result: Record<string, unknown[]> = {};
    for (const period of periods) {
      const rows = await latestSnapshot(ctx.prisma, period, false);
      result[period] = (rows as unknown[]).slice(0, 10);
    }
    cacheSet(cacheKey, result, RANKING_CACHE_TTL_MS);
    return result as { daily: any[]; weekly: any[]; monthly: any[] };
  }),

  getAvailableDates: publicProcedure
    .input(z.object({ period: z.enum(PERIODS).default('daily') }))
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const cacheKey = `rankings:dates:${period}`;
      const cached = cacheGet<string[]>(cacheKey);
      if (cached) return cached;

      const dates = await ctx.prisma.ranking.findMany({
        where: { period },
        orderBy: { date: 'desc' },
        select: { date: true },
        distinct: ['date'],
        take: 90,
      });

      let out: string[];
      if (period === 'weekly') {
        out = Array.from(new Set(dates.map((d) => chinaISOWeek(d.date))));
      } else if (period === 'monthly') {
        out = Array.from(new Set(dates.map((d) => d.date.toISOString().slice(0, 7))));
      } else if (period === 'yearly') {
        out = Array.from(new Set(dates.map((d) => String(d.date.getUTCFullYear()))));
      } else {
        out = dates.map((d) =>
          new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }),
        );
      }
      cacheSet(cacheKey, out, RANKING_CACHE_TTL_MS);
      return out;
    }),
});
