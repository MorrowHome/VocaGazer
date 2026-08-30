/**
 * 定时任务调度器
 * 使用 node-cron 管理定时采集和排行榜生成
 */

import cron from 'node-cron';

let initialized = false;

/** 执行一次采集（增量，最近24小时） */
async function runCrawlTask() {
  console.log('[Scheduler] 开始定时采集...');
  try {
    const { runCrawl } = await import('./bilibili/crawler');
    const result = await runCrawl({
      withinHours: 48,
      requestDelay: 800,
      verbose: false,
    });
    if (result.skipped) {
      console.log('[Scheduler] 采集已关闭，跳过');
      return;
    }
    console.log(`[Scheduler] 采集完成: ${result.savedCount} 首入库, ${result.errors.length} 错误`);
    if (result.errors.length > 0) {
      console.warn('[Scheduler] 错误:', result.errors.slice(0, 3).join(' | '));
    }
    // 采集后立刻刷新快照，避免日榜只在凌晨 0:30 写一次、白天一直空
    try {
      const { generateAllRankings } = await import('./ranking/generator');
      const ranks = await generateAllRankings();
      console.log('[Scheduler] 采集后排行榜:', JSON.stringify(ranks));
    } catch (rankErr) {
      console.error('[Scheduler] 采集后生成排行榜失败:', rankErr);
    }
  } catch (err) {
    console.error('[Scheduler] 采集失败:', err);
  }
}

/** 执行排行榜生成 */
async function runRankingTask() {
  console.log('[Scheduler] 开始生成排行榜...');
  try {
    const { generateAllRankings } = await import('./ranking/generator');
    const { shiftChinaDays } = await import('../../lib/time');
    const y = await generateAllRankings(shiftChinaDays(new Date(), -1));
    const t = await generateAllRankings();
    console.log('[Scheduler] 排行榜(昨日):', JSON.stringify(y));
    console.log('[Scheduler] 排行榜(今日):', JSON.stringify(t));
  } catch (err) {
    console.error('[Scheduler] 排行榜生成失败:', err);
  }
}

/** 全量刷新所有歌曲的统计数据 */
async function runRefreshTask() {
  console.log('[Scheduler] 开始全量刷新歌曲统计...');
  try {
    const { refreshAllSongs } = await import('./bilibili/crawler');
    const result = await refreshAllSongs({ requestDelay: 400 });
    console.log(`[Scheduler] 全量刷新完成: ${result.refreshed} 成功, ${result.failed} 失败`);
  } catch (err) {
    console.error('[Scheduler] 全量刷新失败:', err);
  }
}

/** 生成 AI 晚报 / 趋势 / 异常（同日同类型默认不重复写） */
export async function runAiDailySummary(opts?: { force?: boolean }) {
  console.log('[Scheduler] 开始生成 AI 报告...');
  try {
    const { generateReport, detectAnomalies } = await import('./ai');
    const { prisma } = await import('@/lib/prisma');
    const { chinaCalendarDay, shiftChinaDays } = await import('../../lib/time');

    const allSongs = await prisma.song.findMany({ orderBy: { publishTime: 'desc' } });
    const { start: todayStart } = chinaCalendarDay();
    const weekStart = chinaCalendarDay(shiftChinaDays(new Date(), -7)).start;
    const prevWeekStart = chinaCalendarDay(shiftChinaDays(new Date(), -14)).start;

    const artistMap = new Map<string, { count: number; totalPlays: number }>();
    const monthMap = new Map<string, number>();
    const scored: Array<{ title: string; author: string; score: number; plays: number; likes: number; publishTime: Date }> = [];

    for (const song of allSongs) {
      let stats: { playCount?: number; likes?: number } = {};
      try { stats = JSON.parse(song.statistics); } catch { /* skip */ }
      const plays = stats.playCount || 0;
      const likes = stats.likes || 0;
      const artist = song.author || '未知';
      const a = artistMap.get(artist) || { count: 0, totalPlays: 0 };
      artistMap.set(artist, { count: a.count + 1, totalPlays: a.totalPlays + plays });
      const monthKey = new Date(song.publishTime).toISOString().slice(0, 7);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      scored.push({
        title: song.title,
        author: song.author || '未知',
        score: song.score,
        plays,
        likes,
        publishTime: song.publishTime,
      });
    }
    scored.sort((a, b) => b.score - a.score);

    const data = {
      totalSongs: allSongs.length,
      totalArtists: artistMap.size,
      totalPlayCount: scored.reduce((s, x) => s + x.plays, 0),
      todaySongs: scored.filter((s) => s.publishTime >= todayStart).length,
      weekSongs: scored.filter((s) => s.publishTime >= weekStart).length,
      prevWeekSongs: scored.filter((s) => s.publishTime >= prevWeekStart && s.publishTime < weekStart).length,
      topSongs: scored.slice(0, 10).map(({ title, author, score, plays }) => ({ title, author, score, plays })),
      topArtists: Array.from(artistMap.entries())
        .map(([name, d]) => ({ name, count: d.count, totalPlays: d.totalPlays }))
        .sort((a, b) => b.totalPlays - a.totalPlays).slice(0, 10),
      songsByMonth: Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      anomalies: detectAnomalies(scored),
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

/** 扫描里程碑（每小时检查） */
async function runMilestoneScan() {
  console.log('[Scheduler] 开始扫描里程碑...');
  try {
    const { scanMilestones } = await import('./milestone');
    const result = await scanMilestones();
    if (result.newMilestones > 0) {
      console.log(`[Scheduler] 发现 ${result.newMilestones} 个新里程碑！`);
    }
    if (result.approachingCount > 0) {
      console.log(`[Scheduler] ${result.approachingCount} 首歌曲接近里程碑: ${result.newlyApproaching.slice(0, 3).join(', ')}`);
    }
  } catch (err) {
    console.error('[Scheduler] 里程碑扫描失败:', err);
  }
}

/** 启动所有定时任务 */
export function startScheduler() {
  if (initialized) {
    console.log('[Scheduler] 已启动，跳过');
    return;
  }

  const TZ = 'Asia/Shanghai';

  // 采集任务：每 6 小时运行一次（北京时间 0:00, 6:00, 12:00, 18:00）
  const crawlJob = cron.schedule('0 */6 * * *', () => {
    runCrawlTask();
  }, { timezone: TZ });

  // 排行榜生成：每天北京时间 0:30 运行
  const rankJob = cron.schedule('30 0 * * *', () => {
    runRankingTask();
  }, { timezone: TZ });

  // AI 晚报：每天北京时间 20:00 运行
  const aiJob = cron.schedule('0 20 * * *', () => {
    runAiDailySummary();
  }, { timezone: TZ });

  // 里程碑扫描：每小时
  const milestoneJob = cron.schedule('0 * * * *', () => {
    runMilestoneScan();
  }, { timezone: TZ });

  // 全量刷新：每天北京时间 3:00 运行
  const refreshJob = cron.schedule('0 3 * * *', () => {
    runRefreshTask();
  }, { timezone: TZ });

  initialized = true;
  console.log('[Scheduler] 定时任务已启动');
  console.log('  - 采集: 每 6 小时 (0/6/12/18 点)');
  console.log('  - 排行榜: 每天 0:30');
  console.log('  - AI 晚报: 每天 20:00');
  console.log('  - 全量刷新: 每天 3:00');
  console.log('  - 里程碑扫描: 每小时');

  // 返回句柄以便外部控制
  return { crawlJob, rankJob, aiJob, refreshJob, milestoneJob };
}

/** 获取调度器状态 */
export function getSchedulerStatus() {
  return { running: initialized };
}
