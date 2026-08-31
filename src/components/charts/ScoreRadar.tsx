'use client';

import { formatCount } from '@/lib/utils';

const COUNT_AXES = ['playCount', 'likes', 'coins', 'favorites', 'shares', 'comments'] as const;
const RATE_AXES = ['likeRate', 'coinRate', 'favRate', 'shareRate', 'commentRate', 'coinLikeRate'] as const;

const COUNT_LABELS: Record<(typeof COUNT_AXES)[number], string> = {
  playCount: '播放',
  likes: '点赞',
  coins: '投币',
  favorites: '收藏',
  shares: '分享',
  comments: '评论',
};

const RATE_LABELS: Record<(typeof RATE_AXES)[number], string> = {
  likeRate: '点赞率',
  coinRate: '投币率',
  favRate: '收藏率',
  shareRate: '分享率',
  commentRate: '评论率',
  coinLikeRate: '投币/赞',
};

const SIZE = 360;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 86;

function formatPercent(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

function point(axisIndex: number, axisCount: number, value: number, radius = RADIUS) {
  const angle = (Math.PI * 2 * axisIndex) / axisCount - Math.PI / 2;
  const r = (Math.max(0, value) / 100) * radius;
  return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
}

function polygon(axes: readonly string[], values: Record<string, number>) {
  return axes
    .map((axis, i) => {
      const p = point(i, axes.length, values[axis] ?? 0);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

export function ScoreRadar({
  mode = 'counts',
  song,
  baseline,
  raw,
  baselineRaw,
  className,
}: {
  mode?: 'counts' | 'rates';
  song: Record<string, number>;
  baseline: Record<string, number> | null;
  raw?: Record<string, number>;
  baselineRaw?: Record<string, number> | null;
  className?: string;
}) {
  const axes = mode === 'rates' ? RATE_AXES : COUNT_AXES;
  const labels = mode === 'rates' ? RATE_LABELS : COUNT_LABELS;
  const formatValue = mode === 'rates' ? formatPercent : formatCount;
  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`w-full h-auto mx-auto overflow-visible ${className ?? 'max-w-[360px]'}`}
      role="img"
      aria-label={mode === 'rates' ? '互动率雷达' : '六维数据雷达'}
    >
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={polygon(axes, Object.fromEntries(axes.map((a) => [a, pct])))}
          fill="none"
          stroke="rgba(184,160,255,0.22)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const outer = point(i, axes.length, 100);
        return (
          <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="rgba(184,160,255,0.18)" strokeWidth="1" />
        );
      })}
      {baseline && (
        <polygon
          points={polygon(axes, baseline)}
          fill="rgba(57,197,187,0.14)"
          stroke="#39C5BB"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
      <polygon points={polygon(axes, song)} fill="rgba(255,139,184,0.28)" stroke="#FF8BB8" strokeWidth="2.2" />
      {axes.map((axis, i) => {
        const dot = point(i, axes.length, song[axis] ?? 0);
        return <circle key={`d-${axis}`} cx={dot.x} cy={dot.y} r="3.5" fill="#FF8BB8" />;
      })}
      {axes.map((axis, i) => {
        const labelPt = point(i, axes.length, 172, RADIUS);
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
            <tspan x={labelPt.x} dy="-0.55em">{(labels as Record<string, string>)[axis]}</tspan>
            {typeof count === 'number' && (
              <tspan x={labelPt.x} dy="1.25em" fill="#FF8BB8" fontSize="10">
                {formatValue(mode === 'rates' ? count : Math.round(count))}
                {typeof mean === 'number' && mean > 0
                  ? ` / ${formatValue(mode === 'rates' ? mean : Math.round(mean))}`
                  : ''}
              </tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}
