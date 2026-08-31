/**
 * 一键数据清洗脚本
 * 用法: npx tsx scripts/cleanup.ts [--dry-run] [--verbose]
 *
 * 功能：
 * 1. 用最新过滤规则重新评估所有歌曲
 * 2. 删除不符合要求的垃圾数据
 * 3. 补充缺失的创作者头像
 *
 * 只删规则明确拒绝的；灰区保留（避免误删本家）。
 */
import { PrismaClient } from '@prisma/client';
import { getVideoDetail, delay } from '../src/server/services/bilibili/client';
import { judgeOriginality } from '../src/server/services/bilibili/originality';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

async function main() {
  console.log('');
  console.log(`  ♢ 一键数据清洗${isDryRun ? '（预览模式，不会删除）' : ''}`);
  console.log('');

  const allSongs = await prisma.song.findMany({
    select: {
      id: true, bvId: true, title: true, author: true,
      description: true, duration: true, statistics: true, authorAvatar: true, tags: true,
    },
    orderBy: { id: 'asc' },
  });
  console.log(`  数据库中共 ${allSongs.length} 首歌\n`);

  const toDelete: typeof allSongs = [];
  const needsAvatar: typeof allSongs = [];

  for (const song of allSongs) {
    let tags: string[] = [];
    try {
      const parsed = JSON.parse(song.tags || '[]');
      if (Array.isArray(parsed)) tags = parsed;
    } catch {
      /* ignore */
    }
    const judgment = judgeOriginality({
      title: song.title,
      description: song.description || '',
      duration: song.duration || undefined,
      tags,
    });
    if (judgment.decision === 'reject') {
      toDelete.push(song);
      if (verbose) console.log(`  ✗ [删除] ${song.title.substring(0, 40)} | ${judgment.reason}`);
    } else if (!song.authorAvatar && song.bvId) {
      needsAvatar.push(song);
    }
  }

  console.log(`  评估结果: 保留 ${allSongs.length - toDelete.length} 首, 待删除 ${toDelete.length} 首, 缺头像 ${needsAvatar.length} 首\n`);

  if (toDelete.length > 0 && !isDryRun) {
    console.log('  ▶ 删除垃圾数据...');
    const ids = toDelete.map((s) => s.id);
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      await prisma.ranking.deleteMany({ where: { songId: { in: batch } } });
      await prisma.songDailyStats.deleteMany({ where: { songId: { in: batch } } });
      await prisma.songMilestone.deleteMany({ where: { songId: { in: batch } } });
      await prisma.song.deleteMany({ where: { id: { in: batch } } });
    }
    console.log(`  ✓ 已删除 ${toDelete.length} 首`);
  }

  if (needsAvatar.length > 0 && !isDryRun) {
    const authorBvMap = new Map<string, string>();
    for (const s of needsAvatar) {
      if (!authorBvMap.has(s.author)) authorBvMap.set(s.author, s.bvId);
    }
    console.log(`  ▶ 补充 ${authorBvMap.size} 位创作者的头像（${needsAvatar.length} 首歌曲）...`);
    const authorList: { author: string; bvId: string }[] = [];
    authorBvMap.forEach((bvId, author) => { authorList.push({ author, bvId }); });
    let filled = 0, failed = 0, i = 0;
    for (const { author, bvId } of authorList) {
      try {
        const detail = await getVideoDetail(bvId);
        await delay(400);
        if (detail?.authorAvatar) {
          await prisma.song.updateMany({ where: { author }, data: { authorAvatar: detail.authorAvatar } });
          filled++;
        } else { failed++; }
      } catch { failed++; }
      i++;
      if (i % 10 === 0) console.log(`    进度: ${i}/${authorBvMap.size}`);
    }
    console.log(`  ✓ 头像补充: ${filled} 成功, ${failed} 失败\n`);
  }

  const finalSongs = await prisma.song.count();
  const finalAuthors = await prisma.song.findMany({ select: { author: true }, distinct: ['author'] });
  console.log(`  ♢ 清洗${isDryRun ? '预览' : '完成'}`);
  console.log(`    最终歌曲: ${finalSongs} 首, 创作者: ${finalAuthors.length} 位`);
  console.log('');
}

main().catch((err) => {
  console.error('清洗失败:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
