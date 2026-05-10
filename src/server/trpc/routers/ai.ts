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
});
