/**
 * 爬虫管理 tRPC 路由（管理员）
 */
import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { runCrawl } from '@/server/services/bilibili/crawler';
import { generateFinalRankings, generateLiveRankings } from '@/server/services/ranking/generator';
import { currentJob, isJobLocked, withJobLock } from '@/server/services/job-lock';
import { recomputeSiteStats } from '@/server/services/site-stats';
import { cacheInvalidate } from '../../cache/memory';
import { SETTING_KEYS, setSetting } from '@/server/services/settings';

type CrawlJob = {
  status: 'queued' | 'running' | 'ok' | 'skipped' | 'error';
  at: string;
  savedCount?: number;
  message?: string;
};

function parseCrawlJob(raw: string | null): CrawlJob | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as CrawlJob;
    if (!v?.status || !v?.at) return null;
    return v;
  } catch {
    return null;
  }
}

async function writeCrawlJob(prisma: Parameters<typeof setSetting>[0], job: Omit<CrawlJob, 'at'> & { at?: string }) {
  await setSetting(
    prisma,
    SETTING_KEYS.crawlJob,
    JSON.stringify({ ...job, at: job.at ?? new Date().toISOString() } satisfies CrawlJob),
  );
}

export const crawlRouter = router({
  trigger: adminProcedure
    .input(
      z
        .object({
          withinHours: z.number().min(1).max(168).optional().default(72),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (isJobLocked()) {
        throw new Error(`正在运行 ${currentJob()}，请稍后再试`);
      }

      const withinHours = input?.withinHours ?? 72;
      await writeCrawlJob(ctx.prisma, { status: 'queued' });

      setTimeout(() => {
        void (async () => {
          const { prisma } = await import('@/lib/prisma');
          const locked = await withJobLock('crawl', async () => {
            await writeCrawlJob(prisma, { status: 'running' });
            const result = await runCrawl({
              withinHours,
              verbose: true,
              requestDelay: 600,
            });
            if (!result.skipped) {
              await generateLiveRankings();
              await recomputeSiteStats(prisma);
              cacheInvalidate();
            }
            await writeCrawlJob(prisma, {
              status: result.skipped ? 'skipped' : 'ok',
              savedCount: result.savedCount,
              message: result.skipped ? '采集已关闭' : undefined,
            });
            return result;
          });
          if (!locked.ok) {
            await writeCrawlJob(prisma, {
              status: 'error',
              message: `正在运行 ${locked.holder}，请稍后再试`,
            });
            return;
          }
        })().catch(async (err) => {
          const { prisma } = await import('@/lib/prisma');
          await writeCrawlJob(prisma, {
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
          console.error('[crawl] 后台采集失败:', err);
        });
      }, 0);

      return { started: true as const };
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
        key: { in: ['crawl_enabled', 'crawl_interval', 'last_crawl_time', SETTING_KEYS.crawlJob] },
      },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    let crawlJob = parseCrawlJob(map[SETTING_KEYS.crawlJob] ?? null);
    const job = currentJob();
    const ageMs = crawlJob ? Date.now() - new Date(crawlJob.at).getTime() : 0;
    if (
      (crawlJob?.status === 'queued' || crawlJob?.status === 'running') &&
      job !== 'crawl' &&
      ageMs > 15_000
    ) {
      crawlJob = {
        status: 'error',
        at: crawlJob.at,
        message: '采集中断（进程已重启）',
        savedCount: crawlJob.savedCount,
      };
    }
    return {
      crawl_enabled: map.crawl_enabled ?? null,
      crawl_interval: map.crawl_interval ?? null,
      last_crawl_time: map.last_crawl_time ?? null,
      currentJob: job,
      crawlJob,
    };
  }),
});
