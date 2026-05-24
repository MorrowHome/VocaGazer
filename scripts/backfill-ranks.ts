/**
 * 回溯生成历史排行榜快照
 * - 日榜：过去 30 天每天一期
 * - 周榜：过去 12 周每周一期
 * - 月榜：过去 12 个月每月一期
 * - 年榜、总榜：最新一期
 * 运行: npx tsx scripts/backfill-ranks.ts
 */
import { generateRanking } from '../src/server/services/ranking/generator';

function chinaDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function weeksAgo(w: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - w * 7);
  return d;
}

function monthsAgo(m: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
}

/** 获取某年某月的第一天 */
function firstOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

async function main() {
  console.log('========================================');
  console.log('  回溯生成历史排行榜');
  console.log('========================================');

  // ── 日榜：过去 30 天 ──
  console.log('\n▶ 日榜回溯 30 天:');
  let dailyCount = 0;
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    const count = await generateRanking('daily', date);
    if (count > 0) {
      console.log(`  ${chinaDateStr(date)} → ${count} 首`);
      dailyCount++;
    }
  }
  console.log(`  共 ${dailyCount} 天`);

  // ── 周榜：过去 12 周 ──
  console.log('\n▶ 周榜回溯 12 周:');
  let weeklyCount = 0;
  for (let w = 12; w >= 0; w--) {
    const date = weeksAgo(w);
    const count = await generateRanking('weekly', date);
    if (count > 0) {
      console.log(`  第 ${chinaDateStr(date)} 周 → ${count} 首`);
      weeklyCount++;
    }
  }
  console.log(`  共 ${weeklyCount} 周`);

  // ── 月榜：过去 12 个月 ──
  console.log('\n▶ 月榜回溯 12 个月:');
  let monthlyCount = 0;
  const now = new Date();
  for (let m = 12; m >= 0; m--) {
    const date = monthsAgo(m);
    const count = await generateRanking('monthly', date);
    if (count > 0) {
      console.log(`  ${chinaDateStr(date)} → ${count} 首`);
      monthlyCount++;
    }
  }
  console.log(`  共 ${monthlyCount} 个月`);

  // ── 年榜、总榜：最新一期 ──
  console.log('\n▶ 年榜 / 总榜（最新）:');
  for (const period of ['yearly', 'alltime'] as const) {
    const count = await generateRanking(period);
    console.log(`  ${period.padEnd(10)} → ${count} 首`);
  }

  console.log('\n✅ 完成');
}

main().catch((err) => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
