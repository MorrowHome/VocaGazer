'use client';

import { useMemo, useState, type MouseEvent } from 'react';

type Point = { date: string; missing?: boolean; likeRate: number; coinRate: number; favRate: number };

const SERIES = [
  { key: 'likeRate' as const, label: '点赞率', color: '#FF8BB8' },
  { key: 'coinRate' as const, label: '投币率', color: '#E4C56A' },
  { key: 'favRate' as const, label: '收藏率', color: '#B8A0FF' },
];

export function RateCompareChart({
  data,
  height = 160,
}: {
  data: Point[];
  height?: number;
}) {
  const present = data.filter((d) => !d.missing);
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const layout = useMemo(() => {
    const W = 800;
    const H = height;
    const P = { top: 18, right: 12, bottom: 22, left: 44 };
    const iw = W - P.left - P.right;
    const ih = H - P.top - P.bottom;
    const vals = present.flatMap((d) =>
      SERIES.filter((s) => !hidden[s.key]).map((s) => d[s.key]),
    );
    const maxValue = Math.max(...vals, 0.01);
    const mapX = (i: number) => P.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const mapY = (v: number) => P.top + ih - (v / maxValue) * ih;
    return { W, H, P, iw, ih, maxValue, mapX, mapY };
  }, [data, height, present, hidden]);

  if (present.length < 2) {
    return <p className="text-xs text-kawaii-muted font-medium">暂无</p>;
  }

  const { W, H, P, iw, ih, maxValue, mapX, mapY } = layout;
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const last = present[present.length - 1];
  const shown = hover !== null && !data[hover]?.missing ? data[hover] : last;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  const onMove = (event: MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    data.forEach((d, i) => {
      if (d.missing) return;
      const dist = Math.abs(mapX(i) - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHover(best);
  };

  const pathOf = (key: 'likeRate' | 'coinRate' | 'favRate') => {
    let d = '';
    data.forEach((row, i) => {
      if (row.missing) return;
      d += `${d ? 'L' : 'M'}${mapX(i)},${mapY(row[key])} `;
    });
    return d.trim();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <p className="text-[10px] text-kawaii-muted font-bold">互动率对比</p>
        <div className="flex gap-2">
          {SERIES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setHidden((h) => ({ ...h, [s.key]: !h[s.key] }))}
              className="text-[10px] font-bold"
              style={{ color: hidden[s.key] ? '#6b6280' : s.color, textDecoration: hidden[s.key] ? 'line-through' : 'none' }}
            >
              {s.label} {pct(shown[s.key])}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="点赞率投币率收藏率"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = P.top + ih * t;
          return (
            <g key={t}>
              <line x1={P.left} y1={yy} x2={P.left + iw} y2={yy} stroke="rgba(243,236,255,0.1)" />
              <text x={P.left - 6} y={yy + 3} textAnchor="end" fill="#9B90B8" fontSize="9" fontFamily="ui-monospace, monospace">
                {pct(maxValue * (1 - t))}
              </text>
            </g>
          );
        })}
        {SERIES.filter((s) => !hidden[s.key]).map((s) => (
          <path key={s.key} d={pathOf(s.key)} fill="none" stroke={s.color} strokeWidth="1.8" />
        ))}
        {hover !== null && shown && !shown.missing && (
          <line
            x1={mapX(hover)}
            y1={P.top}
            x2={mapX(hover)}
            y2={P.top + ih}
            stroke="rgba(243,236,255,0.35)"
            strokeDasharray="3 3"
          />
        )}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={d.date} x={mapX(i)} y={H - 4} textAnchor="middle" fill="#9B90B8" fontSize="9" fontFamily="ui-monospace, monospace">
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
