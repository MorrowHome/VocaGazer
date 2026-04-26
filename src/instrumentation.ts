/**
 * Next.js 服务器启动时运行的初始化代码
 * 用于启动定时采集任务
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 延迟启动，等待服务器完全初始化
    const { startScheduler } = await import('./server/services/scheduler');
    startScheduler();
  }
}
