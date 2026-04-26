/**
 * 手动生成排行榜脚本
 * 运行: npx tsx scripts/generate-ranks.ts
 */
import { generateAllRankings } from '../src/server/services/ranking/generator';

async function main() {
  console.log('========================================');
  console.log('  排行榜生成');
  console.log('========================================');

  const result = await generateAllRankings();

  console.log('\n生成结果:');
  for (const [period, count] of Object.entries(result)) {
    console.log(`  ${period.padEnd(10)} ${count} 首`);
  }

  console.log('\n✅ 完成');
}

main().catch(console.error);
