/**
 * 排行榜 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const PERIODS = ['daily', 'weekly', 'monthly', 'alltime'] as const;

export const rankingsRouter = router({
  // 获取排行榜（自动返回最新一期数据）
  get: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
        limit: z.number().min(1).max(100).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { period, limit } = input;

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
});
