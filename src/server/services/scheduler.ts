/**
 * 定时任务调度器
 */
import cron from 'node-cron';
import { withJobLock } from './job-lock';
import { cacheInvalidate } from '../cache/memory';

let initialized = false;

async function runCrawlTask() {
  console.log('[Scheduler] 开始定时采集...');
  const locked = await withJobLock('crawl', async () => {
    const { runCrawl } = await import('./bilibili/crawler');
    const result = await runCrawl({
      withinHours: 72,
      requestDelay: 800,
      verbose: false,
    });
    if (result.skipped) {
      console.log('[Scheduler] 采集已关闭，跳过');
      return result;
    }
    console.log(`[Scheduler] 采集完成: ${result.savedCount} 首入库, ${result.errors.length} 错误`);
    const { generateLiveRankings } = await import('./ranking/generator');
    const { recomputeSiteStats } = await import('./site-stats');
    const { prisma } = await import('@/lib/prisma');
    const ranks = await generateLiveRankings();
    console.log('[Scheduler] 采集后排行榜:', JSON.stringify(ranks));
    await recomputeSiteStats(prisma);
    cacheInvalidate();
    return result;
  });
  if (!locked.ok) console.log('[Scheduler] 采集跳过，忙:', locked.holder);
}

async function runRankingTask() {
  console.log('[Scheduler] 开始生成排行榜（封榜 + live）...');
  const locked = await withJobLock('ranking', async () => {
    const { generateFinalRankings, generateLiveRankings } = await import('./ranking/generator');
    const finals = await generateFinalRankings();
    const live = await generateLiveRankings();
    console.log('[Scheduler] 封榜:', JSON.stringify(finals));
    console.log('[Scheduler] live:', JSON.stringify(live));
  });
  if (!locked.ok) console.log('[Scheduler] 排行跳过，忙:', locked.holder);
}

async function runHourlyRankingTask() {
  const locked = await withJobLock('ranking-hourly', async () => {
    const { generateLiveRankings } = await import('./ranking/generator');
    const live = await generateLiveRankings();
    console.log('[Scheduler] 小时 live 排行:', JSON.stringify(live));
  });
  if (!locked.ok) console.log('[Scheduler] 小时排行跳过，忙:', locked.holder);
}

async function runRefreshTask() {
  console.log('[Scheduler] 开始全量刷新歌曲统计...');
  const locked = await withJobLock('refresh', async () => {
    const { refreshAllSongs } = await import('./bilibili/crawler');
    const result = await refreshAllSongs({ requestDelay: 400 });
    console.log(`[Scheduler] 全量刷新完成: ${result.refreshed} 成功, ${result.failed} 失败`);
    const { recomputeSiteStats } = await import('./site-stats');
    const { prisma } = await import('@/lib/prisma');
    await recomputeSiteStats(prisma);
    const { generateLiveRankings } = await import('./ranking/generator');
    await generateLiveRankings();
    cacheInvalidate();
  });
  if (!locked.ok) console.log('[Scheduler] 刷新跳过，忙:', locked.holder);
}

export async function runAiDailySummary(opts?: { force?: boolean }) {
  console.log('[Scheduler] 开始生成 AI 报告...');
  try {
    const { generateReport, detectAnomalies } = await import('./ai');
    const { prisma } = await import('@/lib/prisma');
    const { chinaCalendarDay, shiftChinaDays } = await import('../../lib/time');
    const { getSiteStats } = await import('./site-stats');

    const { start: todayStart } = chinaCalendarDay();
    const weekStart = chinaCalendarDay(shiftChinaDays(new Date(), -7)).start;
    const prevWeekStart = chinaCalendarDay(shiftChinaDays(new Date(), -14)).start;

    const [site, todaySongs, weekSongs, prevWeekSongs, topSongs, recent, monthRows] = await Promise.all([
      getSiteStats(prisma),
      prisma.song.count({ where: { publishTime: { gte: todayStart } } }),
      prisma.song.count({ where: { publishTime: { gte: weekStart } } }),
      prisma.song.count({
        where: { publishTime: { gte: prevWeekStart, lt: weekStart } },
      }),
      prisma.song.findMany({
        orderBy: { score: 'desc' },
        take: 20,
        select: { title: true, author: true, score: true, statistics: true, publishTime: true },
      }),
      prisma.song.findMany({
        orderBy: { publishTime: 'desc' },
        take: 200,
        select: { title: true, author: true, score: true, statistics: true, publishTime: true },
      }),
      prisma.song.findMany({
        where: { publishTime: { gte: chinaCalendarDay(shiftChinaDays(new Date(), -180)).start } },
        select: { publishTime: true, author: true, statistics: true },
      }),
    ]);

    const parse = (s: string) => {
      try { return JSON.parse(s) as { playCount?: number; likes?: number }; } catch { return {}; }
    };

    const scored = topSongs.map((song) => {
      const stats = parse(song.statistics);
      return {
        title: song.title,
        author: song.author || '未知',
        score: song.score,
        plays: stats.playCount || 0,
        likes: stats.likes || 0,
        publishTime: song.publishTime,
      };
    });

    const artistMap = new Map<string, { count: number; totalPlays: number }>();
    const monthMap = new Map<string, number>();
    for (const song of monthRows) {
      const stats = parse(song.statistics);
      const artist = song.author || '未知';
      const a = artistMap.get(artist) || { count: 0, totalPlays: 0 };
      artistMap.set(artist, { count: a.count + 1, totalPlays: a.totalPlays + (stats.playCount || 0) });
      const monthKey = new Date(song.publishTime).toISOString().slice(0, 7);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    }

    const recentScored = recent.map((song) => {
      const stats = parse(song.statistics);
      return {
        title: song.title,
        author: song.author || '未知',
        score: song.score,
        plays: stats.playCount || 0,
        likes: stats.likes || 0,
      };
    });

    const data = {
      totalSongs: site.totalSongs,
      totalArtists: artistMap.size,
      totalPlayCount: site.totalPlays,
      todaySongs,
      weekSongs,
      prevWeekSongs,
      topSongs: scored.slice(0, 10).map(({ title, author, score, plays }) => ({ title, author, score, plays })),
      topArtists: Array.from(artistMap.entries())
        .map(([name, d]) => ({ name, count: d.count, totalPlays: d.totalPlays }))
        .sort((a, b) => b.totalPlays - a.totalPlays).slice(0, 10),
      songsByMonth: Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      anomalies: detectAnomalies(recentScored),
    };

    const types = ['daily_summary', 'trend_analysis', 'anomaly_detection'] as const;
    for (const type of types) {
      const existed = await prisma.aiReport.findFirst({
        where: { type, createdAt: { gte: todayStart } },
        select: { id: true },
      });
      if (existed && !opts?.force) {
        console.log(`[Scheduler] 今日已有 ${type}，跳过`);
        continue;
      }
      const { title, content } = await generateReport({ type, data });
      const payload = {
        type,
        title,
        content,
        metadata: JSON.stringify({
          songCount: data.totalSongs,
          artistCount: data.totalArtists,
          totalPlays: data.totalPlayCount,
        }),
      };
      if (existed) {
        await prisma.aiReport.update({ where: { id: existed.id }, data: payload });
      } else {
        await prisma.aiReport.create({ data: payload });
      }
    }

    console.log('[Scheduler] AI 报告生成完成');
  } catch (err) {
    console.error('[Scheduler] AI 报告生成失败:', err);
  }
}

async function runMilestoneScan() {
  console.log('[Scheduler] 开始扫描里程碑...');
  try {
    const { scanMilestones } = await import('./milestone');
    const result = await scanMilestones();
    if (result.newMilestones > 0) {
      console.log(`[Scheduler] 发现 ${result.newMilestones} 个新里程碑！`);
    }
  } catch (err) {
    console.error('[Scheduler] 里程碑扫描失败:', err);
  }
}

export function startScheduler() {
  if (initialized) {
    console.log('[Scheduler] 已启动，跳过');
    return;
  }

  const TZ = 'Asia/Shanghai';

  const crawlJob = cron.schedule('0 */6 * * *', () => {
    runCrawlTask();
  }, { timezone: TZ });

  const rankJob = cron.schedule('30 0 * * *', () => {
    runRankingTask();
  }, { timezone: TZ });

  const hourlyRankJob = cron.schedule('15 * * * *', () => {
    runHourlyRankingTask();
  }, { timezone: TZ });

  const aiJob = cron.schedule('0 20 * * *', () => {
    runAiDailySummary();
  }, { timezone: TZ });

  const milestoneJob = cron.schedule('0 * * * *', () => {
    runMilestoneScan();
  }, { timezone: TZ });

  const refreshJob = cron.schedule('0 3 * * *', () => {
    runRefreshTask();
  }, { timezone: TZ });

  initialized = true;
  console.log('[Scheduler] 定时任务已启动');
  console.log('  - 采集: 每 6 小时');
  console.log('  - 排行封榜: 每天 0:30');
  console.log('  - live 排行: 每小时 :15');
  console.log('  - AI 晚报: 每天 20:00');
  console.log('  - 全量刷新: 每天 3:00');
  console.log('  - 里程碑扫描: 每小时');

  return { crawlJob, rankJob, hourlyRankJob, aiJob, refreshJob, milestoneJob };
}

export function getSchedulerStatus() {
  return { running: initialized };
}
