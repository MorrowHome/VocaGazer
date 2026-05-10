/**
 * AI 分析服务
 * 通过 DeepSeek Anthropic 兼容接口调用大模型生成每日晚报
 * 未配置 API key 时自动使用降级方案
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic';
const AI_MODEL = process.env.AI_MODEL || 'deepseek-v4-flash';

// ─── 报告类型 ───
export type ReportType = 'daily_summary';

interface ReportInput {
  type: ReportType;
  data: {
    totalSongs: number;
    totalArtists: number;
    totalPlayCount: number;
    topSongs: { title: string; author: string; score: number; plays: number }[];
    topArtists: { name: string; count: number; totalPlays: number }[];
    songsByMonth: { month: string; count: number }[];
  };
}

// ─── 构建 prompt（只保留晚报） ───
function buildPrompt(input: ReportInput): string {
  const { data } = input;

  return `你是 VOCALOID Music Hub 的数据编辑，每天出一份音乐晚报。

今天的数据如下：
- 歌曲总数：${data.totalSongs}
- UP 主数量：${data.totalArtists}
- 总播放量：${data.totalPlayCount}

今日热门歌曲 TOP3：
${data.topSongs.slice(0, 3).map((s, i) => `${i + 1}. 《${s.title}》- ${s.author}（评分 ${s.score}，播放 ${s.plays}）`).join('\n')}

今日热门 UP 主 TOP3：
${data.topArtists.slice(0, 3).map((a, i) => `${i + 1}. ${a.name}（${a.count} 首歌）`).join('\n')}

月度趋势：
${data.songsByMonth.slice(-6).map((m) => `${m.month}: ${m.count} 首`).join('、')}

请写 3 段话：
1. 今天的数据有什么值得关注的点（高分新曲、高产 UP 主等）
2. 近期的趋势变化（发布节奏、热度变化等）
3. 给用户的推荐（值得听的歌、值得关注的 UP 主等）

要求：口语化，像群聊里发的消息，别写标题，别用列表格式。直接写内容。`;
}

// ─── 生成模拟报告（降级方案） ───
function generateFallbackReport(_data: ReportInput['data']): string {
  const hot = _data.topArtists.slice(0, 3).map((a) => a.name).join('、');
  const top = _data.topSongs.slice(0, 3).map((s) => `《${s.title}》`).join('、');
  return `今天平台新增了不少好歌。${hot} 等 UP 主持续输出。${top} 评分靠前，值得一听。月度数据来看创作热度保持稳定。`;
}

// ─── 生成报告标题 ───
function getReportTitle(): string {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
  return `${dateStr} VOCALOID 晚报`;
}

// ─── 调用大模型 API（DeepSeek Anthropic 兼容接口） ───
async function callAi(prompt: string): Promise<string> {
  if (!API_KEY) {
    console.log('[AI] 未配置 ANTHROPIC_API_KEY，使用降级方案');
    throw new Error('NO_API_KEY');
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({
    apiKey: API_KEY,
    baseURL: BASE_URL,
  });

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find((b) => b.type === 'text');
  return text?.text || '未能生成报告。';
}

// ─── 主入口：生成每日晚报 ───
export async function generateReport(input: ReportInput): Promise<{ title: string; content: string }> {
  const title = getReportTitle();
  const prompt = buildPrompt(input);

  try {
    const content = await callAi(prompt);
    return { title, content };
  } catch (err: any) {
    if (err?.message === 'NO_API_KEY') {
      return { title, content: generateFallbackReport(input.data) };
    }
    console.error('[AI] API 调用失败:', err);
    return { title, content: generateFallbackReport(input.data) };
  }
}

/** 检查 AI 服务是否配置了 API key */
export function isAiConfigured(): boolean {
  return !!API_KEY;
}
