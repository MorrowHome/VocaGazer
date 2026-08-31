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

export function parseSongStats(statistics: string): Stats {
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
 * 每轴 min(100, 50 * value / baselineMean)。
 * 基底均值落在 50；无基底时该轴记 50（避免除零）。
 */
export function normalizeRadar(values: AxisVector, baseline: AxisVector): AxisVector {
  const out = emptyAxes();
  for (const axis of SCORE_AXES) {
    const mean = baseline[axis];
    if (!mean || mean <= 0) {
      out[axis] = values[axis] > 0 ? 100 : 50;
      continue;
    }
    out[axis] = Math.min(100, (50 * values[axis]) / mean);
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

export const BASELINE_FLAT: AxisVector = {
  playCount: 50,
  likes: 50,
  coins: 50,
  favorites: 50,
  shares: 50,
  comments: 50,
};
