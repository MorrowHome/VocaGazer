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
    console.log(`[Scheduler] 采集完成: ${result.savedCount} 首入库, ${result.errors.length} 错误`);
    if (result.errors.length > 0) {
      console.warn('[Scheduler] 错误:', result.errors.slice(0, 3).join(' | '));
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
    const result = await generateAllRankings();
    console.log('[Scheduler] 排行榜生成结果:', JSON.stringify(result));
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

/** 生成每日 AI 数据摘要 */
async function runAiDailySummary() {
  console.log('[Scheduler] 开始生成 AI 数据摘要...');
  try {
    const { generateReport } = await import('./ai');
    const { prisma } = await import('@/lib/prisma');

    const allSongs = await prisma.song.findMany({ orderBy: { publishTime: 'desc' } });

    const artistMap = new Map<string, { count: number; totalPlays: number }>();
    const monthMap = new Map<string, number>();
    const topSongs: Array<{ title: string; author: string; score: number; plays: number }> = [];

    for (const song of allSongs) {
      let stats: any = {};
      try { stats = JSON.parse(song.statistics); } catch {}
      const plays = stats.playCount || 0;
      const artist = song.author || '未知';
      const a = artistMap.get(artist) || { count: 0, totalPlays: 0 };
      artistMap.set(artist, { count: a.count + 1, totalPlays: a.totalPlays + plays });
      const monthKey = new Date(song.publishTime).toISOString().slice(0, 7);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      topSongs.push({ title: song.title, author: song.author || '未知', score: song.score, plays });
    }
    topSongs.sort((a, b) => b.score - a.score);

    const data = {
      totalSongs: allSongs.length,
      totalArtists: artistMap.size,
      totalPlayCount: topSongs.reduce((s, x) => s + x.plays, 0),
      topSongs: topSongs.slice(0, 10).map(({ title, author, score, plays }) => ({ title, author, score, plays })),
      topArtists: Array.from(artistMap.entries())
        .map(([name, d]) => ({ name, count: d.count, totalPlays: d.totalPlays }))
        .sort((a, b) => b.totalPlays - a.totalPlays).slice(0, 10),
      songsByMonth: Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };

    const { title, content } = await generateReport({ type: 'daily_summary', data });

    await prisma.aiReport.create({
      data: {
        type: 'daily_summary',
        title,
        content,
        metadata: JSON.stringify({
          songCount: data.totalSongs,
          artistCount: data.totalArtists,
          totalPlays: data.totalPlayCount,
        }),
      },
    });

    console.log('[Scheduler] AI 数据摘要生成完成');
  } catch (err) {
    console.error('[Scheduler] AI 数据摘要生成失败:', err);
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

  // 采集任务：每 6 小时运行一次（0:00, 6:00, 12:00, 18:00）
  const crawlJob = cron.schedule('0 */6 * * *', () => {
    runCrawlTask();
  });

  // 排行榜生成：每天 0:30 运行
  const rankJob = cron.schedule('30 0 * * *', () => {
    runRankingTask();
  });

  // AI 晚报：每天 20:00 运行
  const aiJob = cron.schedule('0 20 * * *', () => {
    runAiDailySummary();
  });

  // 里程碑扫描：每小时检查
  const milestoneJob = cron.schedule('0 * * * *', () => {
    runMilestoneScan();
  });

  // 全量刷新：每天 3:00 运行
  const refreshJob = cron.schedule('0 3 * * *', () => {
    runRefreshTask();
  });

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
