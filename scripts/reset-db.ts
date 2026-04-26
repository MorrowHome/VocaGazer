/**
 * 重置数据库（清空所有歌曲和排行数据）
 * 运行: npx tsx scripts/reset-db.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('清空排行榜...');
  await prisma.ranking.deleteMany();

  console.log('清空歌曲日统计...');
  await prisma.songDailyStats.deleteMany();

  console.log('清空歌曲...');
  await prisma.song.deleteMany();

  console.log('✅ 数据库已重置');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
