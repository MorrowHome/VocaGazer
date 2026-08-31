/**
 * 评分六维分解与雷达归一化。
 * 原始计数数量级差几个零，不能直接画雷达；以基底均值 = 50 做运动员对照。
 */
import { AXIS_LABELS, SCORE_AXES, WEIGHTS, type ScoreAxis, type Stats } from '../ranking/scorer';

export { AXIS_LABELS, SCORE_AXES, type ScoreAxis };

export type AxisVector = Record<ScoreAxis, number>;

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
export function normalizeRadar(values: AxisVector, baseline: AxisVector): AxisVector {
  const out = emptyAxes();
  for (const axis of SCORE_AXES) {
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
    out[axis] = Math.max(8, Math.min(100, 50 + 15 * Math.log2(ratio)));
  }
  return out;
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
