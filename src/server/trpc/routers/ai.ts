/**
 * AI 分析 tRPC 路由（每日晚报）
 */
import { router, publicProcedure } from '../trpc';
import { isAiConfigured } from '../../services/ai';

export const aiRouter = router({
  /** 获取 AI 配置状态 */
  getConfig: publicProcedure.query(() => {
    return { configured: isAiConfigured() };
  }),

  /** 获取最新一份 AI 晚报 */
  getLatestReport: publicProcedure.query(async ({ ctx }) => {
    const report = await ctx.prisma.aiReport.findFirst({
      where: { type: 'daily_summary' },
      orderBy: { createdAt: 'desc' },
    });
    return report;
  }),

  getLatestBundle: publicProcedure.query(async ({ ctx }) => {
    const types = ['daily_summary', 'trend_analysis', 'anomaly_detection'] as const;
    const reports = await Promise.all(
      types.map((type) =>
        ctx.prisma.aiReport.findFirst({
          where: { type },
          orderBy: { createdAt: 'desc' },
        }),
      ),
    );
    return {
      daily: reports[0],
      trend: reports[1],
      anomaly: reports[2],
    };
  }),
});
