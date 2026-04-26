/**
 * 爬虫管理 tRPC 路由（管理员）
 */
import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { runCrawl } from '@/server/services/bilibili/crawler';

export const crawlRouter = router({
  // 触发一次增量采集
  trigger: adminProcedure
    .input(
      z
        .object({
          withinHours: z.number().min(1).max(168).optional().default(72),
        })
        .optional(),
    )
    .mutation(async ({ input }) => {
      const result = await runCrawl({
        withinHours: input?.withinHours,
        verbose: true,
        requestDelay: 600,
      });
      return result;
    }),

  // 获取爬虫状态
  status: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.setting.findMany({
      where: {
        key: { in: ['crawl_enabled', 'crawl_interval', 'last_crawl_time'] },
      },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }),
});
