'use client';

import { formatCount } from '@/lib/utils';

const AXES = ['playCount', 'likes', 'coins', 'favorites', 'shares', 'comments'] as const;
type Axis = (typeof AXES)[number];

const LABELS: Record<Axis, string> = {
  playCount: '播放',
  likes: '点赞',
  coins: '投币',
  favorites: '收藏',
  shares: '分享',
  comments: '评论',
};

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 92;

function point(axisIndex: number, value: number, radius = RADIUS) {
  const angle = (Math.PI * 2 * axisIndex) / AXES.length - Math.PI / 2;
  const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
  return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
}

function polygon(values: Record<Axis, number>) {
  return AXES.map((axis, i) => {
    const p = point(i, values[axis] ?? 0);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export function ScoreRadar({
  song,
  baseline,
  raw,
  baselineRaw,
}: {
  song: Record<string, number>;
  baseline: Record<string, number> | null;
  raw?: Record<string, number>;
  baselineRaw?: Record<string, number> | null;
}) {
  const rings = [25, 50, 75, 100];
  const songVec = song as Record<Axis, number>;
  const baseVec = baseline as Record<Axis, number> | null;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px] h-auto mx-auto" role="img" aria-label="六维数据雷达">
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={polygon(Object.fromEntries(AXES.map((a) => [a, pct])) as Record<Axis, number>)}
          fill="none"
          stroke="rgba(184,160,255,0.22)"
          strokeWidth="1"
        />
      ))}
      {AXES.map((_, i) => {
        const outer = point(i, 100);
        return (
          <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="rgba(184,160,255,0.18)" strokeWidth="1" />
        );
      })}
      {baseVec && (
        <polygon
          points={polygon(baseVec)}
          fill="rgba(57,197,187,0.14)"
          stroke="#39C5BB"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
      <polygon points={polygon(songVec)} fill="rgba(255,139,184,0.28)" stroke="#FF8BB8" strokeWidth="2.2" />
      {AXES.map((axis, i) => {
        const dot = point(i, songVec[axis] ?? 0);
            return <circle key={`d-${axis}`} cx={dot.x} cy={dot.y} r="3.5" fill="#FF8BB8" />;
      })}
      {AXES.map((axis, i) => {
        const labelPt = point(i, 128, RADIUS);
        const count = raw?.[axis];
        const mean = baselineRaw?.[axis];
        return (
          <text
            key={axis}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#C8B8E0"
            fontSize="11"
            fontWeight="700"
          >
            <tspan x={labelPt.x} dy="-0.55em">{LABELS[axis]}</tspan>
            {typeof count === 'number' && (
              <tspan x={labelPt.x} dy="1.25em" fill="#FF8BB8" fontSize="10">
                {formatCount(count)}
                {typeof mean === 'number' && mean > 0 ? ` / ${formatCount(Math.round(mean))}` : ''}
              </tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}
