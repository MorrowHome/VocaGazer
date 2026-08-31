/**
 * 虚拟歌姬 / 音源引擎词典。
 * 长词优先；短英文名用严格匹配，避免 flower / IA 误伤普通英文。
 */

export type VoiceMatchMode = 'cjk' | 'word' | 'strict';

export interface VoiceEntry {
  name: string;
  engine: string;
  aliases: { text: string; mode: VoiceMatchMode }[];
}

export const VOICE_ENTRIES: VoiceEntry[] = [
  {
    name: '初音未来',
    engine: 'VOCALOID',
    aliases: [
      { text: '初音ミク', mode: 'cjk' },
      { text: '初音未来', mode: 'cjk' },
      { text: 'hatsune miku', mode: 'word' },
      { text: 'hatsune', mode: 'word' },
      { text: '初音', mode: 'cjk' },
      { text: 'miku', mode: 'strict' },
    ],
  },
  {
    name: '镜音铃',
    engine: 'VOCALOID',
    aliases: [
      { text: '鏡音リン', mode: 'cjk' },
      { text: '镜音铃', mode: 'cjk' },
      { text: 'kagamine rin', mode: 'word' },
    ],
  },
  {
    name: '镜音连',
    engine: 'VOCALOID',
    aliases: [
      { text: '鏡音レン', mode: 'cjk' },
      { text: '镜音连', mode: 'cjk' },
      { text: 'kagamine len', mode: 'word' },
    ],
  },
  {
    name: '巡音流歌',
    engine: 'VOCALOID',
    aliases: [
      { text: '巡音ルカ', mode: 'cjk' },
      { text: '巡音流歌', mode: 'cjk' },
      { text: 'megurine luka', mode: 'word' },
      { text: '巡音', mode: 'cjk' },
    ],
  },
  {
    name: 'MEIKO',
    engine: 'VOCALOID',
    aliases: [{ text: 'MEIKO', mode: 'word' }],
  },
  {
    name: 'KAITO',
    engine: 'VOCALOID',
    aliases: [{ text: 'KAITO', mode: 'word' }],
  },
  {
    name: 'GUMI',
    engine: 'VOCALOID',
    aliases: [
      { text: 'GUMI', mode: 'word' },
      { text: 'メグッポイド', mode: 'cjk' },
    ],
  },
  {
    name: 'flower',
    engine: 'VOCALOID',
    aliases: [
      { text: 'v flower', mode: 'word' },
      { text: 'vflower', mode: 'word' },
      { text: 'vocaloid flower', mode: 'word' },
      { text: 'フラワ', mode: 'cjk' },
      { text: 'flower', mode: 'strict' },
    ],
  },
  {
    name: '重音テト',
    engine: 'UTAU',
    aliases: [
      { text: '重音テト', mode: 'cjk' },
      { text: 'kasane teto', mode: 'word' },
      { text: '重音Teto', mode: 'cjk' },
    ],
  },
  {
    name: '音街ウナ',
    engine: 'VOCALOID',
    aliases: [
      { text: '音街ウナ', mode: 'cjk' },
      { text: '音街una', mode: 'cjk' },
    ],
  },
  {
    name: '歌愛ユキ',
    engine: 'VOCALOID',
    aliases: [{ text: '歌愛ユキ', mode: 'cjk' }, { text: '歌爱雪', mode: 'cjk' }],
  },
  {
    name: 'IA',
    engine: 'VOCALOID',
    aliases: [
      { text: 'IA ROCKS', mode: 'word' },
      { text: 'IA', mode: 'strict' },
    ],
  },
  {
    name: '结月缘',
    engine: 'VOCALOID',
    aliases: [
      { text: '結月ゆかり', mode: 'cjk' },
      { text: '结月缘', mode: 'cjk' },
      { text: '结月ゆかり', mode: 'cjk' },
    ],
  },
  {
    name: '可不',
    engine: 'VOCALOID',
    aliases: [
      { text: '可不', mode: 'cjk' },
      { text: 'KAFU', mode: 'word' },
      { text: '歌歩', mode: 'cjk' },
    ],
  },
  {
    name: '知声',
    engine: 'VOCALOID',
    aliases: [{ text: '知声', mode: 'cjk' }],
  },
  {
    name: '洛天依',
    engine: 'VOCALOID',
    aliases: [{ text: '洛天依', mode: 'cjk' }, { text: 'luo tianyi', mode: 'word' }],
  },
  {
    name: '言和',
    engine: 'VOCALOID',
    aliases: [{ text: '言和', mode: 'cjk' }],
  },
  {
    name: '乐正绫',
    engine: 'VOCALOID',
    aliases: [{ text: '乐正绫', mode: 'cjk' }, { text: '樂正綾', mode: 'cjk' }],
  },
  {
    name: '乐正龙牙',
    engine: 'VOCALOID',
    aliases: [{ text: '乐正龙牙', mode: 'cjk' }, { text: '樂正龍牙', mode: 'cjk' }],
  },
  {
    name: '徵羽摩柯',
    engine: 'VOCALOID',
    aliases: [{ text: '徵羽摩柯', mode: 'cjk' }, { text: '征羽摩柯', mode: 'cjk' }],
  },
  {
    name: '墨清弦',
    engine: 'VOCALOID',
    aliases: [{ text: '墨清弦', mode: 'cjk' }],
  },
  {
    name: '星尘',
    engine: 'ACE',
    aliases: [
      { text: '星尘infinity', mode: 'cjk' },
      { text: '星塵Infinity', mode: 'cjk' },
      { text: '星尘Infinity', mode: 'cjk' },
      { text: '星塵', mode: 'cjk' },
      { text: '星尘', mode: 'cjk' },
    ],
  },
  {
    name: '心华',
    engine: 'VOCALOID',
    aliases: [{ text: '心华', mode: 'cjk' }, { text: '心華', mode: 'cjk' }],
  },
  {
    name: '赤羽',
    engine: 'ACE',
    aliases: [{ text: '赤羽', mode: 'cjk' }],
  },
  {
    name: '苍穹',
    engine: 'ACE',
    aliases: [{ text: '虚拟歌姬苍穹', mode: 'cjk' }, { text: '苍穹', mode: 'cjk' }],
  },
  {
    name: '诗岸',
    engine: 'ACE',
    aliases: [{ text: '诗岸', mode: 'cjk' }],
  },
  {
    name: '海伊',
    engine: 'ACE',
    aliases: [{ text: '海伊', mode: 'cjk' }],
  },
  {
    name: '永夜Minus',
    engine: 'ACE',
    aliases: [
      { text: '永夜minus', mode: 'cjk' },
      { text: '永夜Minus', mode: 'cjk' },
      { text: '永夜', mode: 'cjk' },
    ],
  },
  {
    name: '艾可',
    engine: 'ACE',
    aliases: [{ text: '艾可', mode: 'cjk' }],
  },
  {
    name: '小春六花',
    engine: 'Synthesizer V',
    aliases: [{ text: '小春六花', mode: 'cjk' }],
  },
  {
    name: '夏色花梨',
    engine: 'Synthesizer V',
    aliases: [{ text: '夏色花梨', mode: 'cjk' }],
  },
  {
    name: '花隈千冬',
    engine: 'Synthesizer V',
    aliases: [{ text: '花隈千冬', mode: 'cjk' }],
  },
  {
    name: '东北切蒲英',
    engine: 'CeVIO',
    aliases: [
      { text: '東北きりたん', mode: 'cjk' },
      { text: '东北切蒲英', mode: 'cjk' },
      { text: '切蒲英', mode: 'cjk' },
    ],
  },
  {
    name: '弦卷真纪',
    engine: 'CeVIO',
    aliases: [{ text: '弦巻マキ', mode: 'cjk' }, { text: '弦卷真纪', mode: 'cjk' }],
  },
];

export const ENGINE_ALIASES: { name: string; aliases: { text: string; mode: VoiceMatchMode }[] }[] = [
  {
    name: 'VOCALOID',
    aliases: [
      { text: 'ボーカロイド', mode: 'cjk' },
      { text: 'vocaloid', mode: 'word' },
      { text: '术力口', mode: 'cjk' },
      { text: 'ボカロ', mode: 'cjk' },
      { text: '虚拟歌手', mode: 'cjk' },
    ],
  },
  {
    name: 'Synthesizer V',
    aliases: [
      { text: 'synthesizer v', mode: 'word' },
      { text: 'synthv', mode: 'word' },
      { text: 'synth v', mode: 'word' },
    ],
  },
  {
    name: 'UTAU',
    aliases: [{ text: 'utau', mode: 'word' }],
  },
  {
    name: 'CeVIO',
    aliases: [
      { text: 'cevio ai', mode: 'word' },
      { text: 'cevio', mode: 'word' },
    ],
  },
  {
    name: 'DiffSinger',
    aliases: [{ text: 'diffsinger', mode: 'word' }],
  },
  {
    name: 'ACE',
    aliases: [
      { text: 'ace studio', mode: 'word' },
      { text: 'ace虚拟歌姬', mode: 'cjk' },
    ],
  },
];

/** 短词 / 品牌重名：单独出现时只算弱证据 */
export const AMBIGUOUS_NAMES = new Set(['星尘', '苍穹', 'flower', '艾可', 'IA', '赤羽', '永夜Minus']);

/** 采集搜索词（已去重，避免同一歌姬打三遍） */
export const SEARCH_KEYWORDS = [
  'VOCALOID原创',
  '术力口原创',
  '虚拟歌手原创',
  'VOCALOID曲',
  '洛天依',
  '言和',
  '乐正绫',
  '乐正龙牙',
  '徵羽摩柯',
  '墨清弦',
  '星尘infinity',
  '心华',
  '诗岸',
  '海伊',
  '永夜minus',
  '初音ミク',
  '初音未来',
  '镜音铃',
  '镜音连',
  '巡音流歌',
  'MEIKO',
  'KAITO',
  'GUMI',
  '重音テト',
  '音街ウナ',
  '可不',
  '知声',
  '小春六花',
  '夏色花梨',
  '花隈千冬',
  'UTAU原创',
  'CeVIO',
  'DiffSinger',
  'Synthesizer V',
];

export const VOCALOID_TAG_HINTS = [
  'VOCALOID',
  'vocaloid',
  'ボーカロイド',
  '术力口',
  'ボカロ',
  '虚拟歌手',
  'UTAU',
  'CeVIO',
  'Synthesizer V',
  'DiffSinger',
  'ACE Studio',
];

export interface VoiceHit {
  name: string;
  engine: string;
  alias: string;
  ambiguous: boolean;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function aliasMatches(hay: string, alias: string, mode: VoiceMatchMode): boolean {
  if (!hay) return false;
  const a = alias.toLowerCase();
  const h = hay.toLowerCase();
  if (mode === 'cjk') return h.includes(a);
  if (mode === 'strict') {
    return (
      h.includes(`【${a}】`) ||
      h.includes(`[${a}]`) ||
      h.includes(`「${a}」`) ||
      h.includes(`『${a}』`)
    );
  }
  const re = new RegExp(`(?:^|[^a-z0-9_])${escapeRegExp(a)}(?:$|[^a-z0-9_])`, 'i');
  return re.test(hay);
}

const ALIAS_INDEX: { name: string; engine: string; alias: string; mode: VoiceMatchMode; len: number }[] = [];
for (const entry of VOICE_ENTRIES) {
  for (const al of entry.aliases) {
    ALIAS_INDEX.push({
      name: entry.name,
      engine: entry.engine,
      alias: al.text,
      mode: al.mode,
      len: al.text.length,
    });
  }
}
ALIAS_INDEX.sort((a, b) => b.len - a.len);

export function matchVoice(text: string): VoiceHit | null {
  if (!text) return null;
  for (const row of ALIAS_INDEX) {
    if (aliasMatches(text, row.alias, row.mode)) {
      return {
        name: row.name,
        engine: row.engine,
        alias: row.alias,
        ambiguous: AMBIGUOUS_NAMES.has(row.name),
      };
    }
  }
  return null;
}

export function matchEngine(text: string): string | null {
  if (!text) return null;
  for (const eng of ENGINE_ALIASES) {
    const hit = [...eng.aliases].sort((a, b) => b.text.length - a.text.length).find((al) => aliasMatches(text, al.text, al.mode));
    if (hit) return eng.name;
  }
  return null;
}

export function tagsLookVocaloid(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;
  const blob = tags.join(' ');
  if (VOCALOID_TAG_HINTS.some((h) => aliasMatches(blob, h, h.length <= 4 ? 'word' : 'cjk') || blob.toLowerCase().includes(h.toLowerCase()))) {
    return true;
  }
  return matchVoice(blob) !== null || matchEngine(blob) !== null;
}
