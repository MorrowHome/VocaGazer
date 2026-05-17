/**
 * 一键采集脚本入口
 * 用法: npx tsx scripts/crawl.ts [--hours 72] [--verbose]
 */
import { runCrawl } from '../src/server/services/bilibili/crawler';
import { generateAllRankings } from '../src/server/services/ranking/generator';

const hours = process.argv.includes('--hours')
  ? parseInt(process.argv[process.argv.indexOf('--hours') + 1], 10) || 72
  : 72;

const verbose = process.argv.includes('--verbose');

async function main() {
  console.log('');
  console.log(`  ▶ 开始采集（最近 ${hours} 小时）...`);

  const result = await runCrawl({
    withinHours: hours,
    verbose,
    requestDelay: 600,
  });

  console.log('');
  console.log(`  ✓ 采集完成`);
  console.log(`    搜索命中:   ${result.totalVideos}`);
  console.log(`    疑似原创:   ${result.originalCount}`);
  console.log(`    入库成功:   ${result.savedCount}`);
  if (result.errors.length > 0) {
    console.log(`    失败:       ${result.errors.length}`);
    result.errors.slice(0, 5).forEach((e) => console.log(`      - ${e}`));
  }

  if (result.savedCount > 0) {
    console.log('');
    console.log('  ▶ 生成排行榜...');
    await generateAllRankings();
    console.log('  ✓ 排行榜更新完成');
  }
}

main().catch((err) => {
  console.error('采集失败:', err);
  process.exit(1);
});
