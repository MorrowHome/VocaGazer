/**
 * 排行榜 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'alltime'] as const;

export const rankingsRouter = router({
  // 获取排行榜（支持指定日期查看历史排行）
  get: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
        limit: z.number().min(1).max(100).default(100),
        /** ISO 日期字符串（如 '2026-05-10'），不传则取最新一期 */
        date: z.string().nullable().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { period, limit, date } = input;

      let targetDate: Date | null = null;
      if (date) {
        targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
      }

      // 如果指定了日期，查该日期的快照
      if (targetDate) {
        return ctx.prisma.ranking.findMany({
          where: { period, date: targetDate },
          orderBy: { rank: 'asc' },
          take: limit,
          include: { song: true },
        });
      }

      // 未指定日期，返回最新一期
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
      return dates.map((d: { date: Date }) => d.date.toISOString().slice(0, 10));
    }),
});
