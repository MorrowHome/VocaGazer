/**
 * 排行榜 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'alltime'] as const;

/** 将 Date 转为 ISO 周字符串，格式如 "2026-W20" */
function toISOWeek(date: Date): string {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * 根据周期和日期字符串查找该范围内最新的排名快照，
 * 返回快照日期（用于后续查询具体排名条目）。
 */
async function findSnapshotDateInRange(
  prisma: any,
  period: string,
  date: string,
): Promise<Date | null> {
  let start: Date;
  let end: Date;

  if (period === 'weekly') {
    // date format: "YYYY-Www"
    const [y, w] = date.split('-W').map(Number);
    const jan4 = new Date(Date.UTC(y, 0, 4));
    const dow = jan4.getUTCDay() || 7;
    const week1Mon = new Date(jan4);
    week1Mon.setUTCDate(jan4.getUTCDate() - (dow - 1));
    start = new Date(week1Mon);
    start.setUTCDate(start.getUTCDate() + (w - 1) * 7);
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
  } else if (period === 'monthly') {
    const [y, m] = date.split('-').map(Number);
    start = new Date(Date.UTC(y, m - 1, 1));
    end = new Date(Date.UTC(y, m, 1));
  } else {
    // yearly: "YYYY"
    const y = parseInt(date);
    start = new Date(Date.UTC(y, 0, 1));
    end = new Date(Date.UTC(y + 1, 0, 1));
  }

  const snapshot = await prisma.ranking.findFirst({
    where: { period, date: { gte: start, lt: end } },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  return snapshot ? snapshot.date : null;
}

export const rankingsRouter = router({
  // 获取排行榜（支持指定日期查看历史排行）
  get: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
        limit: z.number().min(1).max(100).default(100),
        /** 日期字符串，周期不同格式不同：
         *  daily → 'YYYY-MM-DD', weekly → 'YYYY-Www', monthly → 'YYYY-MM', yearly → 'YYYY' */
        date: z.string().nullable().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { period, limit, date } = input;

      // 周／月／年榜：按时间段查找快照
      if (date && period !== 'daily') {
        const snapshotDate = await findSnapshotDateInRange(ctx.prisma, period, date);
        if (!snapshotDate) return [];
        return ctx.prisma.ranking.findMany({
          where: { period, date: snapshotDate },
          orderBy: { rank: 'asc' },
          take: limit,
          include: { song: true },
        });
      }

      // 日榜：精确匹配日期
      if (date) {
        const [y, m, d] = date.split('-').map(Number);
        const targetDate = new Date(Date.UTC(y, m - 1, d));
        return ctx.prisma.ranking.findMany({
          where: { period, date: targetDate },
          orderBy: { rank: 'asc' },
          take: limit,
          include: { song: true },
        });
      }

      // 未指定日期：返回最新一期
      const latestDate = await ctx.prisma.ranking.findFirst({
        where: { period },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      if (!latestDate) return [];

      return ctx.prisma.ranking.findMany({
        where: { period, date: latestDate.date },
        orderBy: { rank: 'asc' },
        take: limit,
        include: { song: true },
      });
    }),

  // 获取排行榜摘要（用于首页展示）
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const periods = ['daily', 'weekly', 'monthly'] as const;
    const result: Record<string, any[]> = {};

    for (const period of periods) {
      const latestDate = await ctx.prisma.ranking.findFirst({
        where: { period },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      result[period] = latestDate
        ? await ctx.prisma.ranking.findMany({
            where: { period, date: latestDate.date },
            orderBy: { rank: 'asc' },
            take: 10,
            include: { song: true },
          })
        : [];
    }

    return result as { daily: any[]; weekly: any[]; monthly: any[] };
  }),

  // 获取指定周期有快照的日期列表（用于日期选择器）
  getAvailableDates: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const dates = await ctx.prisma.ranking.findMany({
        where: { period },
        orderBy: { date: 'desc' },
        select: { date: true },
        distinct: ['date'],
        take: 90,
      });

      if (period === 'weekly') {
        return Array.from(new Set(dates.map((d: { date: Date }) => toISOWeek(d.date))));
      }
      if (period === 'monthly') {
        return Array.from(new Set(dates.map((d: { date: Date }) => d.date.toISOString().slice(0, 7))));
      }
      if (period === 'yearly') {
        return Array.from(new Set(dates.map((d: { date: Date }) => d.date.getFullYear().toString())));
      }
      // daily：保留原逻辑（中国时区）
      return dates.map((d: { date: Date }) =>
        new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
      );
    }),
});
