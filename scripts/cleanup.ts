/**
 * 一键数据清洗脚本
 * 用法: npx tsx scripts/cleanup.ts [--dry-run] [--verbose]
 *
 * 功能：
 * 1. 用最新过滤规则重新评估所有歌曲
 * 2. 删除不符合要求的垃圾数据
 * 3. 补充缺失的创作者头像
 */
import { PrismaClient } from '@prisma/client';
import { getVideoDetail, delay } from '../src/server/services/bilibili/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

// ========== 过滤规则（与 crawler.ts 保持一致） ==========

const HARD_EXCLUDE = [
  '入驻B站', '入驻b站', '入驻 b站',
  '大家好', '自我介绍', '个人介绍',
  '翻调', '翻配', '翻唱', '翻填', '翻作',
  'remaster', 'カバー',
  '开箱', '联名', '首发',
  '手表', '播放器', '耳机',
  '最新视频已上线', '快来围观',
  '周五夜放克', '周五夜',
  '_bgt_', 'MAD', 'AMV', '手书', '模型', '手办',
  '教程', '教学', '攻略', '入门', '入坑',
  '翻译', '中译', '字幕',
  '周榜', '月榜', '日榜', '排行', '排名',
  '实况', '直播', '录播',
  '盘点', '合集', '合辑', '精选',
  '全集', '完整版',
  '一小段', '试唱',
  '纯音乐', 'instrumental', 'BGM',
  '原声', '原声带', '配乐',
].sort((a, b) => b.length - a.length);

const SOFT_EXCLUDE = [
  'Vlog', 'vlog', '日常', '记录',
  '本命', '我推', '推し', '填词',
  'cover', 'Cover',
  '片头', '片尾', '谱面', '谱子', '自制谱', 'PJSK',
  '真人', '实写', '祭', '演唱会',
  '主题曲', '插曲', '纯伴奏',
  'PV', 'pv', '生贺', '开箱',
  'MMD', 'mmd', '动画', '动漫',
];

const STRONG_ORIGINAL = [
  '原创', '作曲', '编曲', '作词',
  'VOCALOID原曲', '术力口原曲',
  '自制曲', '本家', '个人制作',
  '调声', '混音', 'producer', 'produced by',
];

const DESC_ORIGINAL_SIGNALS = [
  '作曲', '编曲', '作词', '调声',
  'producer', 'produced by',
  'music by', 'lyrics by',
  'VOCALOID', 'vocaloid', '调教',
];

const KNOWN_NON_MUSIC = ['苍穹', '艾可瑞', '斗破苍穹', '苍穹的法芙娜'];

const VOCALOID_TAGS = [
  'vocaloid', 'VOCALOID', 'ボーカロイド',
  '初音ミク', '初音未来', 'miku', '初音',
  '鏡音リン', '镜音铃', '镜音连', '鏡音レン',
  '巡音ルカ', '巡音流歌', 'luka',
  'MEIKO', 'KAITO',
  '洛天依', '言和', '乐正绫', '乐正龙牙',
  '徵羽摩柯', '墨清弦',
  '星尘', '星塵', 'infinity', '心华',
  '赤羽', '苍穹', '诗岸', '海伊', '永夜', '永夜minus', 'Minus', '艾可',
  '小春六花', '夏色花梨', '花隈千冬',
  'GUMI', 'flower', '重音テト',
  '音街ウナ', '歌愛ユキ',
  'synthesizer v', 'Synthesizer V',
  'UTAU', 'CeVIO', 'VOICEVOX', 'NEUTRINO', 'NAKOTALK',
  '术力口', 'ボカロ', 'vocaloid中文',
];

function judgeOriginality(
  title: string, description: string, duration?: number,
): { isOriginal: boolean; score: number; reason: string } {
  const titleLow = title.toLowerCase();
  const desc = (description || '').toLowerCase();
  const combined = `${titleLow} ${desc}`;

  for (const kw of HARD_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) {
      return { isOriginal: false, score: -100, reason: `硬排除: "${kw}"` };
    }
  }
  if (duration !== undefined && duration > 0 && (duration < 30 || duration > 900)) {
    return { isOriginal: false, score: -80, reason: `时长异常: ${duration}s` };
  }
  if (/本家\s*[:：]\s*BV/i.test(desc)) return { isOriginal: false, score: -90, reason: '描述含本家+BV' };
  if (/原曲\s*[:：]\s*BV/i.test(desc)) return { isOriginal: false, score: -90, reason: '描述含原曲+BV' };
  if (/站内本家/i.test(desc)) return { isOriginal: false, score: -90, reason: '描述含站内本家' };

  const mentionsChar = VOCALOID_TAGS.some((vt) => titleLow.includes(vt.toLowerCase()));
  if (!mentionsChar) return { isOriginal: false, score: -50, reason: '标题无 V 家角色名' };

  for (const nm of KNOWN_NON_MUSIC) {
    if (titleLow.includes(nm.toLowerCase()) && !desc.includes('作曲') && !desc.includes('原创')) {
      return { isOriginal: false, score: -70, reason: `非音乐信号: "${nm}"` };
    }
  }
  for (const kw of STRONG_ORIGINAL) {
    if (title.includes(kw)) return { isOriginal: true, score: 100, reason: `强原创: "${kw}"` };
  }

  let score = 20;
  if (duration && duration >= 60 && duration <= 480) score += 15;
  if (DESC_ORIGINAL_SIGNALS.some((s) => desc.includes(s))) score += 25;
  if (description && description.includes('VOCALOID')) score += 10;
  for (const kw of SOFT_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) score -= 20;
  }
  const hasAnyMusicSignal = STRONG_ORIGINAL.some((k) => combined.includes(k.toLowerCase()))
    || DESC_ORIGINAL_SIGNALS.some((s) => combined.includes(s))
    || combined.includes('VOCALOID')
    || combined.includes('歌');
  if (!hasAnyMusicSignal) score -= 10;

  return score >= 25
    ? { isOriginal: true, score, reason: `得分 ${score}` }
    : { isOriginal: false, score, reason: `得分不足 ${score}` };
}

// ========== 执行清洗 ==========

async function main() {
  console.log('');
  console.log(`  ♢ 一键数据清洗${isDryRun ? '（预览模式，不会删除）' : ''}`);
  console.log('');

  const allSongs = await prisma.song.findMany({
    select: {
      id: true, bvId: true, title: true, author: true,
      description: true, duration: true, statistics: true, authorAvatar: true,
    },
    orderBy: { id: 'asc' },
  });
  console.log(`  数据库中共 ${allSongs.length} 首歌\n`);

  const toDelete: typeof allSongs = [];
  const needsAvatar: typeof allSongs = [];

  for (const song of allSongs) {
    const judgment = judgeOriginality(song.title, song.description || '', song.duration || undefined);
    if (!judgment.isOriginal) {
      toDelete.push(song);
      if (verbose) console.log(`  ✗ [删除] ${song.title.substring(0, 40)} | ${judgment.reason}`);
    } else if (!song.authorAvatar && song.bvId) {
      needsAvatar.push(song);
    }
  }

  console.log(`  评估结果: 保留 ${allSongs.length - toDelete.length} 首, 待删除 ${toDelete.length} 首, 缺头像 ${needsAvatar.length} 首\n`);

  // 删除垃圾数据
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

  // 补充头像（按创作者去重，节省 API 调用）
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
