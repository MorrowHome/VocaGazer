/**
 * 回溯生成历史排行榜快照
 * 用当前歌曲评分按过去的日期分别生成排行榜
 * 运行: npx tsx scripts/backfill-ranks.ts
 */
import { generateRanking, generateAllRankings } from '../src/server/services/ranking/generator';

function chinaDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function prevDay(date: Date, n: number = 1): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const days = 30;
  console.log(`========================================`);
  console.log(`  回溯生成过去 ${days} 天的排行榜`);
  console.log(`========================================`);

  // 生成 daily 快照：每天一期
  const today = new Date();
  console.log(`\n▶ 日榜回溯 ${days} 天:`);
  let dailyCount = 0;
  for (let i = 0; i < days; i++) {
    const date = prevDay(today, days - 1 - i); // 从最旧的日期开始
    const count = await generateRanking('daily', date);
    if (count > 0) {
      console.log(`  ${chinaDateStr(date)} → ${count} 首`);
      dailyCount++;
    }
  }
  console.log(`  共生成 ${dailyCount} 天日榜数据`);

  // weekly / monthly / yearly / alltime：只生成最新一期
  console.log(`\n▶ 周／月／年／总榜（最新一期）:`);
  for (const period of ['weekly', 'monthly', 'yearly', 'alltime'] as const) {
    const count = await generateRanking(period, today);
    console.log(`  ${period.padEnd(10)} → ${count} 首`);
  }

  console.log(`\n✅ 完成`);
}

main().catch((err) => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
