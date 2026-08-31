/**
 * 评分六维分解与雷达归一化。
 * 原始计数数量级差几个零，不能直接画雷达；以基底均值 = 50 做运动员对照。
 */
import { AXIS_LABELS, SCORE_AXES, WEIGHTS, type ScoreAxis, type Stats } from '../ranking/scorer';

export { AXIS_LABELS, SCORE_AXES, type ScoreAxis };

export type AxisVector = Record<ScoreAxis, number>;

export const RATE_AXES = ['likeRate', 'coinRate', 'favRate', 'shareRate', 'commentRate', 'coinLikeRate'] as const;
export type RateAxis = (typeof RATE_AXES)[number];
export type RateVector = Record<RateAxis, number>;

export const RATE_LABELS: Record<RateAxis, string> = {
  likeRate: '点赞率',
  coinRate: '投币率',
  favRate: '收藏率',
  shareRate: '分享率',
  commentRate: '评论率',
  coinLikeRate: '投币/赞',
};

const ZERO_RATES: RateVector = {
  likeRate: 0,
  coinRate: 0,
  favRate: 0,
  shareRate: 0,
  commentRate: 0,
  coinLikeRate: 0,
};

export function emptyRates(): RateVector {
  return { ...ZERO_RATES };
}

/** 计数转互动率：前五轴相对播放，投币/赞看点赞里有多少真投了币 */
export function ratesFromAxes(v: AxisVector): RateVector {
  const plays = Math.max(0, v.playCount);
  const likes = Math.max(0, v.likes);
  return {
    likeRate: plays > 0 ? v.likes / plays : 0,
    coinRate: plays > 0 ? v.coins / plays : 0,
    favRate: plays > 0 ? v.favorites / plays : 0,
    shareRate: plays > 0 ? v.shares / plays : 0,
    commentRate: plays > 0 ? v.comments / plays : 0,
    coinLikeRate: likes > 0 ? v.coins / likes : 0,
  };
}

export function hasRateValues(v: RateVector): boolean {
  return RATE_AXES.some((axis) => v[axis] > 0);
}

/** 按歌平均互动率，播放为 0 的不进均值 */
export function meanRatesFromAxes(rows: AxisVector[]): RateVector {
  const acc = emptyRates();
  let n = 0;
  for (const row of rows) {
    if (row.playCount <= 0) continue;
    const r = ratesFromAxes(row);
    for (const axis of RATE_AXES) acc[axis] += r[axis];
    n++;
  }
  if (n === 0) return acc;
  for (const axis of RATE_AXES) acc[axis] /= n;
  return acc;
}

const ZERO: AxisVector = {
  playCount: 0,
  likes: 0,
  coins: 0,
  favorites: 0,
  shares: 0,
  comments: 0,
};

export function emptyAxes(): AxisVector {
  return { ...ZERO };
}

/** 加权分量：stats[axis] * weight */
export function scoreBreakdown(stats: Stats): AxisVector {
  const out = emptyAxes();
  for (const axis of SCORE_AXES) {
    out[axis] = (stats[axis] || 0) * WEIGHTS[axis];
  }
  return out;
}

export function parseSongStats(statistics: string): AxisVector {
  try {
    const s = JSON.parse(statistics) as Partial<Stats>;
    return {
      playCount: s.playCount || 0,
      likes: s.likes || 0,
      coins: s.coins || 0,
      favorites: s.favorites || 0,
      shares: s.shares || 0,
      comments: s.comments || 0,
    };
  } catch {
    return {
      playCount: 0,
      likes: 0,
      coins: 0,
      favorites: 0,
      shares: 0,
      comments: 0,
    };
  }
}

/**
 * 每轴：图均 = 50；每翻一倍约 +15（2 倍→65，4 倍→80）。
 * 线性 50×比值会让热门曲六轴全顶到 100，看起来像没数据。
 */
export function normalizeAgainstMean<K extends string>(
  values: Record<K, number>,
  baseline: Record<K, number>,
  axes: readonly K[],
): Record<K, number> {
  const out = Object.fromEntries(axes.map((axis) => [axis, 0])) as Record<K, number>;
  for (const axis of axes) {
    const mean = baseline[axis];
    const value = values[axis];
    if (!mean || mean <= 0) {
      out[axis] = value > 0 ? 80 : 20;
      continue;
    }
    const ratio = Math.max(value, 0) / mean;
    if (ratio <= 0) {
      out[axis] = 8;
      continue;
    }
    out[axis] = Math.max(8, Math.min(160, 50 + 15 * Math.log2(ratio)));
  }
  return out;
}

export function normalizeRadar(values: AxisVector, baseline: AxisVector): AxisVector {
  return normalizeAgainstMean(values, baseline, SCORE_AXES);
}

export function meanAxes(rows: AxisVector[]): AxisVector {
  const acc = emptyAxes();
  if (rows.length === 0) return acc;
  for (const row of rows) {
    for (const axis of SCORE_AXES) acc[axis] += row[axis];
  }
  for (const axis of SCORE_AXES) acc[axis] /= rows.length;
  return acc;
}

export function hasAxisValues(v: AxisVector): boolean {
  return SCORE_AXES.some((axis) => v[axis] > 0);
}

export function axisDelta(latest: AxisVector, previous: AxisVector | null | undefined): AxisVector {
  if (!previous) return { ...latest };
  const out = emptyAxes();
  for (const axis of SCORE_AXES) {
    out[axis] = Math.max(0, (latest[axis] || 0) - (previous[axis] || 0));
  }
  return out;
}

export function toAxisVector(row: {
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
}): AxisVector {
  return {
    playCount: row.playCount || 0,
    likes: row.likes || 0,
    coins: row.coins || 0,
    favorites: row.favorites || 0,
    shares: row.shares || 0,
    comments: row.comments || 0,
  };
}

/** 无图均时：用 log 轮廓让播放/评论的相对强弱仍能看出来 */
export function logProfile(values: AxisVector): AxisVector {
  const logs = emptyAxes();
  let max = 0;
  for (const axis of SCORE_AXES) {
    logs[axis] = Math.log10(1 + Math.max(0, values[axis]));
    if (logs[axis] > max) max = logs[axis];
  }
  const out = emptyAxes();
  if (max <= 0) {
    for (const axis of SCORE_AXES) out[axis] = 50;
    return out;
  }
  for (const axis of SCORE_AXES) out[axis] = Math.min(100, (logs[axis] / max) * 100);
  return out;
}

export const BASELINE_FLAT: AxisVector = {
  playCount: 50,
  likes: 50,
  coins: 50,
  favorites: 50,
  shares: 50,
  comments: 50,
};

export const BASELINE_FLAT_RATES: RateVector = {
  likeRate: 50,
  coinRate: 50,
  favRate: 50,
  shareRate: 50,
  commentRate: 50,
  coinLikeRate: 50,
};

/** 无图均时：互动率用放大后的 log，避免 0.04 这种小数挤成一条线 */
export function logProfileRates(values: RateVector): RateVector {
  const logs = emptyRates();
  let max = 0;
  for (const axis of RATE_AXES) {
    logs[axis] = Math.log10(1 + Math.max(0, values[axis]) * 1000);
    if (logs[axis] > max) max = logs[axis];
  }
  const out = emptyRates();
  if (max <= 0) {
    for (const axis of RATE_AXES) out[axis] = 50;
    return out;
  }
  for (const axis of RATE_AXES) out[axis] = Math.min(100, (logs[axis] / max) * 100);
  return out;
}
