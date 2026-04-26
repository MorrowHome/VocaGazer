/**
 * 手动采集脚本（深度模式）
 * 运行: npx tsx scripts/run-crawl.ts
 */
import { runCrawl } from '../src/server/services/bilibili/crawler';

async function main() {
  console.log('========================================');
  console.log('  VOCALOID 深度采集');
  console.log('========================================');

  const result = await runCrawl({
    withinHours: 720,   // 30天
    verbose: true,
    requestDelay: 500,
  });

  console.log('\n========================================');
  console.log('  采集完成');
  console.log('========================================');
  console.log(`  搜索到视频: ${result.totalVideos}`);
  console.log(`  原创候选:   ${result.originalCount}`);
  console.log(`  成功入库:   ${result.savedCount}`);
  console.log(`  失败:       ${result.errors.length}`);
  if (result.errors.length > 0) {
    console.log('\n  错误列表:');
    result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
  }
}

main().catch(console.error);
