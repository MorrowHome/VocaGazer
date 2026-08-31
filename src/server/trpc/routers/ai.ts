/**
 * AI 分析 tRPC 路由（每日晚报）
 */
import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { isAiConfigured, maskApiKey, resolveAiConfig } from '../../services/ai';
import { SETTING_KEYS, setSetting } from '../../services/settings';

export const aiRouter = router({
  getConfig: publicProcedure.query(async () => {
    return { configured: await isAiConfigured() };
  }),

  getAdminConfig: adminProcedure.query(async () => {
    const cfg = await resolveAiConfig();
    return {
      configured: Boolean(cfg.apiKey),
      fromAdmin: cfg.fromAdmin,
      maskedKey: maskApiKey(cfg.apiKey),
      baseUrl: cfg.baseUrl,
      model: cfg.model,
    };
  }),

  setAdminConfig: adminProcedure
    .input(
      z.object({
        apiKey: z.string().max(200).optional(),
        baseUrl: z.string().max(200).optional(),
        model: z.string().max(80).optional(),
        clearKey: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.clearKey) {
        await setSetting(ctx.prisma, SETTING_KEYS.aiApiKey, '');
      } else if (input.apiKey && input.apiKey.trim()) {
        await setSetting(ctx.prisma, SETTING_KEYS.aiApiKey, input.apiKey.trim());
      }
      if (typeof input.baseUrl === 'string') {
        await setSetting(ctx.prisma, SETTING_KEYS.aiBaseUrl, input.baseUrl.trim());
      }
      if (typeof input.model === 'string') {
        await setSetting(ctx.prisma, SETTING_KEYS.aiModel, input.model.trim());
      }
      const cfg = await resolveAiConfig();
      return {
        configured: Boolean(cfg.apiKey),
        fromAdmin: cfg.fromAdmin,
        maskedKey: maskApiKey(cfg.apiKey),
        baseUrl: cfg.baseUrl,
        model: cfg.model,
      };
    }),

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
