/**
 * 清理已入库的非 VOCALOID 数据
 * 使用最新过滤规则重新检查全部歌曲
 *
 * 用法: npx tsx scripts/cleanup.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 排除关键词（与 crawler.ts 保持一致） ───

const EXCLUDE_KEYWORDS = [
  '周榜', '月榜', '日榜', '年榜', '排行', '排名',
  '传说曲', '人气曲', '殿堂曲', '金曲',
  '教程', '教学', '攻略', '入门', '入坑', '指北', '指南',
  '翻译', '中译', '日文', '日语', '罗马音', '字幕',
  '翻唱', '翻填', '翻作',
  'remix', 'remaster', 'cover',
  'カバー',
  '填词',
  '自制谱', '谱面', '谱子', 'PJSK', 'project sekai',
  '一小段', '试唱',
  '演唱会', '祭',
  '盘点', '合集', '合辑', '精选', '专辑',
  '手办', 'MAD', 'MMD', '3D', '建模', '手书',
  '完整版', '全集', '全话', '全篇',
  '真人', '实写', '实写化', '真人版', '真人化',
  // 'OP' / 'ED' 太短（2字母）容易误匹配歌词/元数据，用 '片头' '片尾' '主题曲' 替代
  '片头', '片尾', '主题曲',
  'BGM', 'OST', '原声', '原声带',
  '插曲', '配乐', '纯音乐', 'instrumental',
  'jojo', 'JoJo',
  '鬼灭', '咒术', '海贼', '火影', '死神',
  '龙珠', '灌篮高手', '进击的巨人', 'EVA',
  '间谍过家家', '葬送的芙莉莲', '我推的孩子',
  '原神', '崩坏', '星穹铁道', '方舟', '碧蓝',
  '电影', '影视', '电视剧', '综艺', '纪录片',
  'Vlog', 'vlog', '日常', '记录',
  '游戏', '实况', '直播', '录播',
];

const MEDIA_KEYWORDS = [
  'jojo', 'JoJo',
  '鬼灭', '咒术', '海贼', '火影', '死神',
  '龙珠', '灌篮高手', '进击的巨人', 'EVA',
  '间谍过家家', '葬送的芙莉莲', '我推的孩子',
  '原神', '崩坏', '星穹铁道', '方舟', '碧蓝',
  '电影', '影视', '电视剧', '综艺', '纪录片',
];

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
  'UTAU', 'CeVIO', 'VOICEVOX',
  'NEUTRINO', 'NAKOTALK',
  '术力口', 'ボカロ', 'vocaloid中文',
];

// ─── 检测逻辑 ───

function shouldExclude(title: string): boolean {
  // 只检查标题。描述包含歌词/元数据, 误报率太高
  return EXCLUDE_KEYWORDS.some((kw) => title.toLowerCase().includes(kw.toLowerCase()));
}

function shouldExcludeFromDesc(description: string): boolean {
  // 描述仅检查强信号（较长的关键词）
  const strong = EXCLUDE_KEYWORDS.filter(kw => kw.length >= 4);
  return strong.some((kw) => description.toLowerCase().includes(kw.toLowerCase()));
}

function mentionsVocaloidChar(text: string): boolean {
  return VOCALOID_TAGS.some((vt) => text.toLowerCase().includes(vt.toLowerCase()));
}

function titleOnlyMatchesExclude(title: string): { matched: boolean; isMediaOnly: boolean } {
  const titleLow = title.toLowerCase();
  const matched = EXCLUDE_KEYWORDS.some((kw) => titleLow.includes(kw.toLowerCase()));
  if (!matched) return { matched: false, isMediaOnly: false };
  const mediaHit = MEDIA_KEYWORDS.some((kw) => titleLow.includes(kw.toLowerCase()));
  const nonMediaHit = EXCLUDE_KEYWORDS.some(
    (kw) => !MEDIA_KEYWORDS.includes(kw) && titleLow.includes(kw.toLowerCase()),
  );
  return { matched: true, isMediaOnly: mediaHit && !nonMediaHit };
}

function hasVocaloidTag(tags: string[]): boolean {
  return tags.some((t) =>
    VOCALOID_TAGS.some((vt) => t.toLowerCase().includes(vt.toLowerCase())),
  );
}

function isSuspiciousDuration(duration: number): boolean {
  return duration < 60 || duration > 900;
}

// ─── 主流程 ───

async function main() {
  const allSongs = await prisma.song.findMany({ orderBy: { publishTime: 'desc' } });
  console.log(`共 ${allSongs.length} 首歌曲，开始检查...\n`);

  const badSongs: Array<{ id: string; title: string; author: string; reason: string }> = [];

  for (const song of allSongs) {
    let tags: string[] = [];
    try { tags = JSON.parse(song.tags || '[]'); } catch {}

    const desc = song.description || '';
    const titleDesc = `${song.title} ${desc}`;
    const reasons: string[] = [];

    // 排除关键词检查（含媒体名豁免）
    const excludeCheck = titleOnlyMatchesExclude(song.title);
    const titleMentionsChar = mentionsVocaloidChar(song.title);
    if (excludeCheck.matched) {
      if (!(excludeCheck.isMediaOnly && titleMentionsChar)) {
        reasons.push('含排除关键词');
      }
    }

    // 标签/角色名检查：标题里有角色名的跳过标签检查
    if (!mentionsVocaloidChar(titleDesc) && !hasVocaloidTag(tags)) {
      reasons.push('无角色名+无VOCALOID标签');
    }

    if (song.duration && isSuspiciousDuration(song.duration)) {
      reasons.push(`时长异常(${song.duration}s)`);
    }

    if (reasons.length > 0) {
      badSongs.push({ id: song.id, title: song.title, author: song.author || '未知', reason: reasons.join(', ') });
    }
  }

  if (badSongs.length === 0) {
    console.log('✅ 所有歌曲均通过检查，无需清理。');
    return;
  }

  console.log(`以下 ${badSongs.length} 首歌曲可能是误入库：\n`);
  badSongs.forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.reason}] ${s.title} — ${s.author}`);
  });

  console.log('\n---');
  console.log(`执行删除: npx tsx scripts/cleanup.ts --delete`);
  console.log(`(不加 --delete 只预览不删除)`);

  // 如果传了 --delete 参数则执行删除
  if (process.argv.includes('--delete')) {
    console.log('\n开始删除...');
    for (const s of badSongs) {
      await prisma.song.delete({ where: { id: s.id } });
      console.log(`  ✗ 已删除: ${s.title}`);
    }
    console.log(`\n✅ 共删除 ${badSongs.length} 首`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('清理失败:', err);
  process.exit(1);
});
