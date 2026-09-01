/**
 * 虚拟歌姬原创曲判定：规则砍两头，灰区交给可选的模型。
 */
import { matchEngine, matchVoice, tagsLookVocaloid } from './voices';

export const TID_VOCALOID = 193;
export const TID_ORIGINAL_MUSIC = 28;
export const REJECT_TIDS: Record<number, string> = {
  31: '翻唱',
  59: '演奏',
  244: '音乐教学',
  243: '乐评盘点',
  20: '宅舞',
  129: '舞蹈',
  154: '街舞',
  156: '舞蹈教程',
  198: '明星舞蹈',
  199: '中国舞',
  200: '舞蹈综合',
  255: '国风舞蹈',
};

const HARD_EXCLUDE = [
  '入驻B站', '入驻b站', '入驻 b站',
  '大家好', '自我介绍', '个人介绍',
  '翻调', '翻配', '翻唱', '翻填', '翻作', '翻跳',
  'remaster', 'カバー', '歌ってみた', '踊ってみた',
  '跳舞', '宅舞', '编舞', '振付',
  'cosplay', '角色扮演', 'COS正片', '【COS】', '「COS」',
  '这个视频，送给', '这个视频,送给',
  'RVC', 'rvc', 'so-vits', 'sovits', 'GPT-SoVITS', 'gpt-sovits',
  'AI翻唱', 'ai翻唱', 'AI 翻唱',
  '歌切', '切片',
  '开箱', '联名', '首发',
  '手表', '播放器', '耳机',
  '最新视频已上线', '快来围观',
  '周五夜放克', '周五夜',
  '_bgt_',
  'MAD', 'AMV',
  '手书',
  '模型', '手办',
  '教程', '教学', '攻略',
  '入门', '入坑',
  '翻译', '中译', '字幕',
  '周榜', '月榜', '日榜',
  '排行', '排名',
  '实况', '直播', '录播',
  '盘点', '合集', '合辑', '精选',
  '全集',
  '一小段', '试唱',
  '纯音乐', 'instrumental', 'BGM',
  '原声带', '配乐',
  '安徽星尘', '星尘希儿', '星尘十字军', '星尘列车',
  '测试服', '体验服',
  '卡面剧情',
  '全连', '存活所有',
  '电竞', '纪录片',
  '吸尘器', '扭腰舞',
  'WOTA艺', 'wota艺',
  '明末', 'PS5PRO',
].sort((a, b) => b.length - a.length);

const HARD_EXCLUDE_ANYWHERE = [
  'RVC', 'so-vits', 'sovits', 'GPT-SoVITS', 'AI翻唱', '歌ってみた', '踊ってみた',
  'cosplay', '翻跳', '宅舞',
];

const EVENT_TITLE = ['周年', '生贺', '生日快乐', '応援', '应援', '纪念活动', '征稿'];

const NON_SONG_MEDIA = ['MMD', 'mmd', '手书', '教程', '教学'];

const SOFT_EXCLUDE = [
  'Vlog', 'vlog', '日常', '记录',
  '本命', '我推', '推し',
  '填词',
  'cover', 'Cover',
  '片头', '片尾',
  '谱面', '谱子', '自制谱', 'PJSK',
  '真人', '实写',
  '祭',
  '演唱会',
  '主题曲',
  '插曲',
  '纯伴奏',
  '生贺',
  '开箱',
  '动画', '动漫',
];

const CREDIT_RES = [
  /作曲/,
  /编曲/,
  /作词/,
  /作詞/,
  /调声/,
  /调教/,
  /編曲/,
  /produced\s+by/i,
  /\bproducer\b/i,
  /music\s+by/i,
  /lyrics\s+by/i,
  /音楽\s*[:：]/,
  /(?:^|[\s【\[(（])vo(?:cal)?\s*[:：.]/i,
  /(?:^|[\s【\[(（])feat\.?\s/i,
];

const ORIGINAL_WORDS = ['原创曲', 'VOCALOID原曲', '术力口原曲', '自制曲', '本家', '原创', 'オリジナル'];

const KNOWN_NON_MUSIC = ['斗破苍穹', '苍穹的法芙娜', '艾可瑞'];

export interface OriginalityInput {
  title: string;
  description?: string;
  tags?: string[];
  duration?: number;
  copyright?: number;
  tid?: number;
  tname?: string;
  matchedSearchTags?: string[];
}

export type OriginalityDecision = 'accept' | 'reject' | 'gray';

export interface OriginalityJudgment {
  decision: OriginalityDecision;
  isOriginal: boolean;
  score: number;
  reason: string;
  virtual: boolean;
  original: boolean;
}

export interface GraySongInput {
  bvId: string;
  title: string;
  author?: string;
  description?: string;
  tags?: string[];
  tname?: string;
  duration?: number;
  reason: string;
}

export interface GraySongVerdict {
  bvId: string;
  accept: boolean;
  reason: string;
}

function reject(reason: string, score: number): OriginalityJudgment {
  return { decision: 'reject', isOriginal: false, score, reason, virtual: false, original: false };
}

function accept(reason: string, score: number, virtual: boolean, original: boolean): OriginalityJudgment {
  return { decision: 'accept', isOriginal: true, score, reason, virtual, original };
}

function gray(reason: string, score: number, virtual: boolean, original: boolean): OriginalityJudgment {
  return { decision: 'gray', isOriginal: false, score, reason, virtual, original };
}

function blobOf(input: OriginalityInput): string {
  return [
    input.title || '',
    input.description || '',
    ...(input.tags || []),
    ...(input.matchedSearchTags || []),
  ].join('\n');
}

function hasCredits(text: string): boolean {
  return CREDIT_RES.some((re) => re.test(text));
}

function hasOriginalWord(text: string): boolean {
  return ORIGINAL_WORDS.some((w) => text.includes(w));
}

function hasSongEvidence(title: string, desc: string, tags: string[]): boolean {
  return hasCredits(`${title}\n${desc}`) || hasOriginalWord(title) || hasOriginalWord(tags.join(' ')) || /《.+》/.test(title);
}

function hasPerformanceSignal(title: string, tags: string[]): string | null {
  const titleLow = title.toLowerCase();
  const titleHits = ['舞蹈', '宅舞', '翻跳', '编舞', '街舞', 'cosplay', '角色扮演', '踊ってみた', '【cos】', '「cos」', '[cos]'];
  for (const kw of titleHits) {
    if (titleLow.includes(kw.toLowerCase())) return kw;
  }
  const tagHits = ['舞蹈', '宅舞', '翻跳', '编舞', '街舞', 'cos', 'cosplay', '角色扮演', '踊ってみた'];
  for (const tag of tags) {
    const t = tag.trim().toLowerCase();
    if (tagHits.includes(t)) return tag;
  }
  return null;
}

function nonSongWithoutCredits(title: string, desc: string): boolean {
  const hit = NON_SONG_MEDIA.some((k) => title.includes(k) || title.toLowerCase().includes(k.toLowerCase()));
  if (!hit) return false;
  return !hasCredits(`${title}\n${desc}`);
}

export function judgeOriginality(input: OriginalityInput): OriginalityJudgment {
  const title = input.title || '';
  const desc = input.description || '';
  const tags = input.tags || [];
  const combined = blobOf(input);
  const titleLow = title.toLowerCase();
  const combinedLow = combined.toLowerCase();

  for (const kw of HARD_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) {
      return reject(`硬排除: "${kw}"`, -100);
    }
  }
  for (const kw of HARD_EXCLUDE_ANYWHERE) {
    if (combinedLow.includes(kw.toLowerCase())) {
      return reject(`硬排除: "${kw}"`, -100);
    }
  }

  if (input.duration !== undefined && input.duration > 0) {
    if (input.duration < 30 || input.duration > 900) {
      return reject(`时长异常: ${input.duration}s`, -80);
    }
  }

  if (/本家\s*[:：]\s*BV/i.test(desc) || /原曲\s*[:：]\s*BV/i.test(desc) || /站内本家/i.test(desc)) {
    return reject('描述指向他人本家', -90);
  }

  if (input.copyright === 2) {
    return reject('B 站标记为转载', -90);
  }

  if (input.tid && REJECT_TIDS[input.tid]) {
    return reject(`分区为${REJECT_TIDS[input.tid]}`, -90);
  }

  const performance = hasPerformanceSignal(title, tags);
  if (performance) {
    return reject(`表演/COS: "${performance}"`, -90);
  }

  if (EVENT_TITLE.some((kw) => title.includes(kw)) && !hasSongEvidence(title, desc, tags)) {
    return reject('周年/生贺/应援且无原创曲证据', -80);
  }

  if (nonSongWithoutCredits(title, desc)) {
    return reject('MMD/手书/教程且无作曲调教', -70);
  }

  for (const nm of KNOWN_NON_MUSIC) {
    if (titleLow.includes(nm.toLowerCase()) && !hasCredits(desc) && !hasOriginalWord(title)) {
      return reject(`非音乐信号: "${nm}"`, -70);
    }
  }

  const voiceTitle = matchVoice(title);
  const voiceTags = matchVoice(tags.join(' '));
  const voiceDesc = matchVoice(desc);
  const voice = voiceTitle || voiceTags || voiceDesc || matchVoice((input.matchedSearchTags || []).join(' '));
  const engine = matchEngine(combined);
  const partitionVocaloid =
    input.tid === TID_VOCALOID ||
    (input.tname || '').toLowerCase().includes('vocaloid') ||
    (input.tname || '').includes('VOCALOID');
  const tagVocaloid = tagsLookVocaloid(tags) || tagsLookVocaloid(input.matchedSearchTags);

  const virtualStrong = Boolean(
    (voice && !voice.ambiguous) ||
      engine ||
      partitionVocaloid ||
      tagVocaloid,
  );
  const virtualWeak = Boolean(voice?.ambiguous && !virtualStrong);
  const virtual = virtualStrong || virtualWeak;

  const credits = hasCredits(`${title}\n${desc}`);
  const originalWord = hasOriginalWord(title) || hasOriginalWord(tags.join(' '));
  const bookTitle = /《.+》/.test(title);
  const copyrightOriginal = input.copyright === 1;
  const durationOk =
    input.duration !== undefined && input.duration >= 60 && input.duration <= 480;
  const originalMusicPart = input.tid === TID_ORIGINAL_MUSIC;

  let originalScore = 0;
  if (credits) originalScore += 30;
  if (originalWord) originalScore += 25;
  if (bookTitle) originalScore += 15;
  if (copyrightOriginal) originalScore += 10;
  if (durationOk) originalScore += 5;
  if (originalMusicPart && virtualStrong) originalScore += 10;
  if (partitionVocaloid && copyrightOriginal) originalScore += 10;

  for (const kw of SOFT_EXCLUDE) {
    if (titleLow.includes(kw.toLowerCase())) originalScore -= 15;
  }

  const originalStrong = credits || (originalWord && virtualStrong);
  const originalMedium = (bookTitle && virtualStrong) || originalScore >= 55;
  const original = originalStrong || originalMedium;

  if (!virtual) {
    if (originalWord || credits) {
      return gray('有原创信号但未识别虚拟歌姬', originalScore, false, original);
    }
    return reject('未识别虚拟歌姬', -50);
  }

  if (virtualWeak && !originalStrong && !tagVocaloid && !partitionVocaloid) {
    return gray(`短词歧义: ${voice?.name || '未知'}`, originalScore + 10, true, original);
  }

  if (virtualStrong && originalStrong) {
    return accept(`虚拟歌姬原创 (${voice?.name || engine || input.tname || '分区/标签'})`, 80 + originalScore, true, true);
  }

  if (virtualStrong && originalMedium) {
    return accept(`虚拟歌姬曲 (${voice?.alias || engine || '标签'})`, 50 + originalScore, true, true);
  }

  if (virtualStrong && !original) {
    return gray('虚拟歌姬明确，原创证据不足', originalScore + 25, true, false);
  }

  return gray(`待确认: ${voice?.name || engine || '虚拟歌姬'}`, originalScore + 15, virtual, original);
}

export function buildGrayPrompt(items: GraySongInput[]): string {
  const list = items.map((it, i) => {
    const tags = (it.tags || []).slice(0, 12).join('、') || '（无）';
    const desc = (it.description || '').replace(/\s+/g, ' ').slice(0, 280);
    return `${i + 1}. bvId=${it.bvId}
标题: ${it.title}
UP: ${it.author || '未知'}
分区: ${it.tname || '未知'} 时长: ${it.duration ?? '?'}s
标签: ${tags}
简介: ${desc || '（空）'}
规则存疑: ${it.reason}`;
  }).join('\n\n');

  return `你是 VOCALOID Hub 的入库审核。只收录「虚拟歌姬原创曲」。

收录：VOCALOID / 中文虚拟歌手 / Synthesizer V / UTAU / CeVIO / DiffSinger 的本家原创歌（含本家 PV）。
排除：真人原创、翻唱/歌ってみた/踊ってみた、COS/宅舞/编舞、周年应援活动、RVC/so-vits/AI 变声、教程、MMD/手书且没有作曲、搬运转载、演奏、盘点合集。bilibilionly同人扶持计划只是活动角标，不能当成原创曲证据。

对下面每条输出 JSON 数组，元素形如 {"bvId":"BVxx","accept":true或false,"reason":"一句中文"}。不要 markdown，不要其它文字。

${list}`;
}

function extractJsonArray(raw: string): unknown {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('NO_JSON');
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function judgeGrayBatch(
  items: GraySongInput[],
  callModel?: (prompt: string) => Promise<string>,
): Promise<GraySongVerdict[]> {
  if (items.length === 0) return [];
  if (!callModel) {
    return items.map((it) => ({ bvId: it.bvId, accept: false, reason: '灰区未配置模型，不入库' }));
  }
  try {
    const raw = await callModel(buildGrayPrompt(items));
    const parsed = extractJsonArray(raw);
    if (!Array.isArray(parsed)) throw new Error('NOT_ARRAY');
    const byId = new Map<string, GraySongVerdict>();
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const rec = row as { bvId?: unknown; accept?: unknown; reason?: unknown };
      const bvId = String(rec.bvId || '');
      if (!bvId) continue;
      byId.set(bvId, {
        bvId,
        accept: rec.accept === true,
        reason: typeof rec.reason === 'string' && rec.reason ? rec.reason : '模型判定',
      });
    }
    return items.map((it) => byId.get(it.bvId) || {
      bvId: it.bvId,
      accept: false,
      reason: '模型未返回该条，不入库',
    });
  } catch {
    return items.map((it) => ({ bvId: it.bvId, accept: false, reason: '模型判定失败，不入库' }));
  }
}
