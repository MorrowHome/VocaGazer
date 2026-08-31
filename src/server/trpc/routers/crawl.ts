/**
 * 爬虫管理 tRPC 路由（管理员）
 */
import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { runCrawl } from '@/server/services/bilibili/crawler';
import { generateFinalRankings, generateLiveRankings } from '@/server/services/ranking/generator';
import { withJobLock } from '@/server/services/job-lock';
import { recomputeSiteStats } from '@/server/services/site-stats';
import { cacheInvalidate } from '../../cache/memory';

export const crawlRouter = router({
  trigger: adminProcedure
    .input(
      z
        .object({
          withinHours: z.number().min(1).max(168).optional().default(72),
        })
        .optional(),
    )
    .mutation(async ({ input }) => {
      const locked = await withJobLock('crawl', async () => {
        const result = await runCrawl({
          withinHours: input?.withinHours,
          verbose: true,
          requestDelay: 600,
        });
        if (!result.skipped) {
          await generateLiveRankings();
          const { prisma } = await import('@/lib/prisma');
          await recomputeSiteStats(prisma);
          cacheInvalidate();
        }
        return result;
      });
      if (!locked.ok) throw new Error(`正在运行 ${locked.holder}，请稍后再试`);
      return locked.result;
    }),

  generateRanks: adminProcedure.mutation(async () => {
    const locked = await withJobLock('ranking', async () => {
      const finals = await generateFinalRankings();
      const live = await generateLiveRankings();
      cacheInvalidate();
      return { ...live, finals };
    });
    if (!locked.ok) throw new Error(`正在运行 ${locked.holder}，请稍后再试`);
    return locked.result;
  }),

  generateAi: adminProcedure
    .input(z.object({ force: z.boolean().optional() }).optional())
    .mutation(async ({ input }) => {
      const { runAiDailySummary } = await import('@/server/services/scheduler');
      await runAiDailySummary({ force: input?.force ?? true });
      return { ok: true };
    }),

  status: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.setting.findMany({
      where: {
        key: { in: ['crawl_enabled', 'crawl_interval', 'last_crawl_time'] },
      },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }),
});
