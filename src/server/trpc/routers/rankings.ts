/**
 * 排行榜 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const PERIODS = ['daily', 'weekly', 'monthly', 'alltime'] as const;

export const rankingsRouter = router({
  // 获取排行榜
  get: publicProcedure
    .input(
      z.object({
        period: z.enum(PERIODS).default('daily'),
        date: z.string().optional(), // YYYY-MM-DD 格式，默认为今天
        limit: z.number().min(1).max(100).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { period, limit } = input;
      const targetDate = input.date
        ? new Date(input.date)
        : new Date();

      // 从 Ranking 表获取排行榜
      const rankings = await ctx.prisma.ranking.findMany({
        where: {
          period,
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        },
        orderBy: { rank: 'asc' },
        take: limit,
        include: {
          song: true,
        },
      });

      return rankings;
    }),

  // 获取排行榜摘要（用于首页展示）
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [dailyTop, weeklyTop, monthlyTop] = await Promise.all([
      ctx.prisma.ranking.findMany({
        where: {
          period: 'daily',
          date: { gte: today },
        },
        orderBy: { rank: 'asc' },
        take: 10,
        include: { song: true },
      }),
      ctx.prisma.ranking.findMany({
        where: {
          period: 'weekly',
          date: { gte: today },
        },
        orderBy: { rank: 'asc' },
        take: 10,
        include: { song: true },
      }),
      ctx.prisma.ranking.findMany({
        where: {
          period: 'monthly',
          date: { gte: today },
        },
        orderBy: { rank: 'asc' },
        take: 10,
        include: { song: true },
      }),
    ]);

    return { daily: dailyTop, weekly: weeklyTop, monthly: monthlyTop };
  }),
});
