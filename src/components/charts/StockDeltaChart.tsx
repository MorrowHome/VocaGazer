'use client';

import { useMemo, useState, type MouseEvent } from 'react';

type Point = { date: string; value: number; missing?: boolean };

export function StockDeltaChart({
  data,
  height = 160,
  label = '单日增量',
  formatter,
}: {
  data: Point[];
  height?: number;
  label?: string;
  formatter: (v: number) => string;
}) {
  const present = data.filter((d) => !d.missing);
  const [hover, setHover] = useState<number | null>(null);

  const layout = useMemo(() => {
    const W = 800;
    const H = height;
    const P = { top: 18, right: 56, bottom: 22, left: 52 };
    const iw = W - P.left - P.right;
    const ih = H - P.top - P.bottom;
    const maxValue = Math.max(...present.map((d) => d.value), 1);
    const mapX = (i: number) => P.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const mapY = (v: number) => P.top + ih - (v / maxValue) * ih;
    const slot = data.length > 1 ? iw / (data.length - 1) : iw;
    const barW = Math.max(2, Math.min(14, slot * 0.62));
    return { W, H, P, iw, ih, maxValue, mapX, mapY, barW };
  }, [data, height, present]);

  if (present.length < 2) {
    return <p className="text-xs text-kawaii-muted font-medium">暂无</p>;
  }

  const { W, H, P, iw, ih, maxValue, mapX, mapY, barW } = layout;
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const last = [...present].pop()!;
  const hoverPt = hover !== null && !data[hover]?.missing ? data[hover] : null;
  const shown = hoverPt ?? last;

  let line = '';
  data.forEach((d, i) => {
    if (d.missing) return;
    const cmd = line ? 'L' : 'M';
    line += `${cmd}${mapX(i)},${mapY(d.value)} `;
  });

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

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-[10px] text-kawaii-muted font-bold">{label}</p>
        <p className="font-mono text-xs font-bold text-kawaii-cyan tabular-nums">
          {shown.date.slice(5)} · {formatter(shown.value)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={label}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const yy = P.top + ih * pct;
          return (
            <g key={pct}>
              <line
                x1={P.left}
                y1={yy}
                x2={P.left + iw}
                y2={yy}
                stroke="rgba(243,236,255,0.1)"
                strokeWidth="1"
              />
              <text x={P.left - 6} y={yy + 3} textAnchor="end" fill="#9B90B8" fontSize="9" fontFamily="ui-monospace, monospace">
                {formatter(maxValue * (1 - pct))}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          if (d.missing) return null;
          const prev = data.slice(0, i).reverse().find((p) => !p.missing);
          const up = !prev || d.value >= prev.value;
          const x = mapX(i);
          const y = mapY(d.value);
          const fill = up ? 'rgba(255,139,184,0.78)' : 'rgba(57,197,187,0.72)';
          return (
            <rect
              key={`b-${d.date}`}
              x={x - barW / 2}
              y={y}
              width={barW}
              height={Math.max(1, P.top + ih - y)}
              fill={fill}
              opacity={hover === i ? 1 : 0.85}
            />
          );
        })}
        <path d={line.trim()} fill="none" stroke="rgba(243,236,255,0.55)" strokeWidth="1.4" />
        {hover !== null && hoverPt && (
          <>
            <line
              x1={mapX(hover)}
              y1={P.top}
              x2={mapX(hover)}
              y2={P.top + ih}
              stroke="rgba(243,236,255,0.35)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={mapX(hover)} cy={mapY(hoverPt.value)} r="3.2" fill="#fff" stroke="#FF8BB8" strokeWidth="1.6" />
          </>
        )}
        <line x1={P.left} y1={P.top + ih} x2={P.left + iw} y2={P.top + ih} stroke="rgba(243,236,255,0.2)" />
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={d.date} x={mapX(i)} y={H - 4} textAnchor="middle" fill="#9B90B8" fontSize="9" fontFamily="ui-monospace, monospace">
              {d.date.slice(5)}
            </text>
          );
        })}
        <text
          x={P.left + iw + 6}
          y={mapY(last.value) + 3}
          fill="#39C5BB"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
        >
          {formatter(last.value)}
        </text>
      </svg>
    </div>
  );
}
