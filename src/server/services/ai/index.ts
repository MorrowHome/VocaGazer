/**
 * AI 分析服务
 * 通过 DeepSeek Anthropic 兼容接口调用大模型
 * 未配置 API key 时自动使用降级方案
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic';
const AI_MODEL = process.env.AI_MODEL || 'deepseek-v4-flash';

export type ReportType = 'daily_summary' | 'trend_analysis' | 'anomaly_detection';

export interface ReportData {
  totalSongs: number;
  totalArtists: number;
  totalPlayCount: number;
  todaySongs?: number;
  weekSongs?: number;
  prevWeekSongs?: number;
  topSongs: { title: string; author: string; score: number; plays: number }[];
  topArtists: { name: string; count: number; totalPlays: number }[];
  songsByMonth: { month: string; count: number }[];
  anomalies?: { title: string; author: string; reason: string }[];
}

interface ReportInput {
  type: ReportType;
  data: ReportData;
}

function chinaDateLabel(): string {
  const now = new Date();
  const str = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  return str;
}

function buildPrompt(input: ReportInput): string {
  const { type, data } = input;
  const topSongs = data.topSongs
    .slice(0, 5)
    .map((s, i) => `${i + 1}. 《${s.title}》- ${s.author}（评分 ${s.score.toFixed(0)}，播放 ${s.plays}）`)
    .join('\n');
  const topArtists = data.topArtists
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.name}（${a.count} 首歌，播放 ${a.totalPlays}）`)
    .join('\n');
  const months = data.songsByMonth
    .slice(-6)
    .map((m) => `${m.month}: ${m.count} 首`)
    .join('、');

  if (type === 'trend_analysis') {
    return `你是 VOCALOID 数据编辑。请根据以下数据写一段趋势分析（约 200 字，口语化，不要标题列表）：
歌曲总数 ${data.totalSongs}，本周新曲 ${data.weekSongs ?? '未知'}，上周新曲 ${data.prevWeekSongs ?? '未知'}。
热门 UP：
${topArtists}
月度发布：${months}
说明发布节奏、谁在上升、中文曲/日语曲如果能从歌名看出来也可以提一句。`;
  }

  if (type === 'anomaly_detection') {
    const anomalies = (data.anomalies ?? [])
      .slice(0, 6)
      .map((a) => `- 《${a.title}》${a.author}：${a.reason}`)
      .join('\n');
    return `你是 VOCALOID 数据编辑。下面是系统标出的异常/爆款候选，请用口语写 2 段话解读（不要标题）：
${anomalies || '（暂无显著异常）'}
热门歌曲：
${topSongs}`;
  }

  return `你是 VOCALOID Music Hub 的数据编辑，每天出一份音乐晚报。

今天的数据如下：
- 歌曲总数：${data.totalSongs}
- 今日新曲：${data.todaySongs ?? '未知'}
- 本周新曲：${data.weekSongs ?? '未知'}
- UP 主数量：${data.totalArtists}
- 总播放量：${data.totalPlayCount}

今日热门歌曲 TOP5：
${topSongs}

今日热门 UP 主 TOP5：
${topArtists}

月度趋势：${months}

请写 3 段话：关注点、近期趋势、给用户的推荐。口语化，别写标题，别用列表。`;
}

function generateFallbackReport(type: ReportType, data: ReportData): string {
  const hot = data.topArtists.slice(0, 3).map((a) => a.name).join('、') || '一些创作者';
  const top = data.topSongs.slice(0, 3).map((s) => `《${s.title}》`).join('、') || '新曲';
  if (type === 'trend_analysis') {
    return `本周新曲 ${data.weekSongs ?? 0} 首，上周 ${data.prevWeekSongs ?? 0} 首。${hot} 仍是高播放主力，发布节奏可以对照月度曲线看。`;
  }
  if (type === 'anomaly_detection') {
    const a = data.anomalies?.[0];
    return a
      ? `值得盯一眼：${a.author} 的《${a.title}》，${a.reason}。其余热门仍是 ${top}。`
      : `暂时没有极端异常，热门仍集中在 ${top}。`;
  }
  return `今天平台新增了不少好歌。${hot} 等 UP 主持续输出。${top} 评分靠前，值得一听。`;
}

function getReportTitle(type: ReportType): string {
  const d = chinaDateLabel();
  if (type === 'trend_analysis') return `${d} 趋势观察`;
  if (type === 'anomaly_detection') return `${d} 异常扫描`;
  return `${d} VOCALOID 晚报`;
}

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

export async function generateReport(input: ReportInput): Promise<{ title: string; content: string }> {
  const title = getReportTitle(input.type);
  const prompt = buildPrompt(input);

  try {
    const content = await callAi(prompt);
    return { title, content };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'NO_API_KEY') {
      return { title, content: generateFallbackReport(input.type, input.data) };
    }
    console.error('[AI] API 调用失败:', err);
    return { title, content: generateFallbackReport(input.type, input.data) };
  }
}

export function isAiConfigured(): boolean {
  return !!API_KEY;
}

/** 给灰区判定等短任务用的原始补全 */
export async function completePrompt(prompt: string): Promise<string> {
  return callAi(prompt);
}

export function detectAnomalies(
  songs: { title: string; author: string; score: number; plays: number; likes: number }[],
): { title: string; author: string; reason: string }[] {
  const out: { title: string; author: string; reason: string }[] = [];
  const byPlays = [...songs].sort((a, b) => b.plays - a.plays);
  const p95 = byPlays[Math.floor(byPlays.length * 0.05)]?.plays ?? 0;

  for (const s of songs.slice(0, 80)) {
    if (s.plays > 0 && s.likes / s.plays > 0.12 && s.plays >= 1000) {
      out.push({ title: s.title, author: s.author, reason: `点赞率偏高（${((s.likes / s.plays) * 100).toFixed(1)}%）` });
    } else if (p95 > 0 && s.plays >= p95 && s.score > 0) {
      out.push({ title: s.title, author: s.author, reason: `播放量进入前 5%（${s.plays}）` });
    }
    if (out.length >= 8) break;
  }
  return out;
}
