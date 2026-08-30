/**
 * 数据库种子：系统设置 + 本地管理员
 *
 * 管理员账号（可用环境变量覆盖）：
 *   SEED_ADMIN_EMAIL     默认 admin@localhost
 *   SEED_ADMIN_PASSWORD  默认 changeme-admin
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

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

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@localhost';
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme-admin';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash },
    create: {
      username: 'admin',
      email,
      passwordHash,
      role: 'admin',
    },
  });

  console.log(`管理员已就绪：${email}`);

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    const admin = await prisma.user.findUnique({ where: { email } });
    if (admin) {
      await prisma.post.create({
        data: {
          title: '欢迎来到 VOCALOID Hub 论坛',
          content:
            '这里用来讨论虚拟歌手原创曲：评测、推荐、提问都可以。发帖时可以关联站内歌曲，歌曲页也会回链到相关讨论。\n\n默认管理员密码请尽快改掉。',
          type: 'discussion',
          tags: JSON.stringify(['欢迎', '公告']),
          relatedSongs: '[]',
          authorId: admin.id,
          isPinned: true,
        },
      });
      console.log('已写入示例欢迎帖');
    }
  }

  console.log('初始化完成');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
