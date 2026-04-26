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

  initialized = true;
  console.log('[Scheduler] 定时任务已启动');
  console.log('  - 采集: 每 6 小时 (0/6/12/18 点)');
  console.log('  - 排行榜: 每天 0:30');

  // 返回句柄以便外部控制
  return { crawlJob, rankJob };
}

/** 获取调度器状态 */
export function getSchedulerStatus() {
  return { running: initialized };
}
