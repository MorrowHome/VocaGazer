/**
 * 数据库种子脚本
 * 用于初始化系统设置和测试数据
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  // 创建系统设置
  await prisma.setting.upsert({
    where: { key: 'crawl_enabled' },
    update: {},
    create: { key: 'crawl_enabled', value: 'true' },
  });

  await prisma.setting.upsert({
    where: { key: 'crawl_interval' },
    update: {},
    create: { key: 'crawl_interval', value: '0 5,12,18 * * *' },
  });

  console.log('✅ 初始化完成');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
