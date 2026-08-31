'use client';

import { useId, useMemo, useState, type MouseEvent } from 'react';

export type TrendSeries = { key: string; label: string; color: string };

type Row = { date: string; missing?: boolean } & Record<string, number | string | boolean | undefined>;

export function MetricTrendChart({
  data,
  series,
  height = 280,
  formatter,
  label,
  fill = false,
}: {
  data: Row[];
  series: TrendSeries[];
  height?: number;
  formatter: (v: number) => string;
  label?: string;
  fill?: boolean;
}) {
  const present = data.filter((d) => !d.missing);
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const gid = useId().replace(/:/g, '');

  const layout = useMemo(() => {
    const W = 960;
    const H = height;
    const P = { top: 18, right: 16, bottom: 28, left: 56 };
    const iw = W - P.left - P.right;
    const ih = H - P.top - P.bottom;
    const active = series.filter((s) => !hidden[s.key]);
    const vals = present.flatMap((d) => active.map((s) => Number(d[s.key]) || 0));
    const maxValue = Math.max(...vals, 0.0001);
    const mapX = (i: number) => P.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const mapY = (v: number) => P.top + ih - (v / maxValue) * ih;
    return { W, H, P, iw, ih, maxValue, mapX, mapY, active };
  }, [data, height, present, series, hidden]);

  if (present.length < 2) {
    return <p className="text-xs text-kawaii-muted font-medium">暂无足够快照</p>;
  }

  const { W, H, P, iw, ih, maxValue, mapX, mapY, active } = layout;
  const labelStep = Math.max(1, Math.floor(data.length / 7));
  const last = present[present.length - 1];
  const shown = hover !== null && !data[hover]?.missing ? data[hover] : last;

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

  const pathOf = (key: string) => {
    let d = '';
    data.forEach((row, i) => {
      if (row.missing) return;
      d += `${d ? 'L' : 'M'}${mapX(i)},${mapY(Number(row[key]) || 0)} `;
    });
    return d.trim();
  };

  const areaOf = (key: string) => {
    const line = pathOf(key);
    if (!line) return '';
    const pts: number[] = [];
    data.forEach((row, i) => {
      if (!row.missing) pts.push(i);
    });
    if (pts.length < 2) return '';
    return `${line} L${mapX(pts[pts.length - 1])},${P.top + ih} L${mapX(pts[0])},${P.top + ih} Z`;
  };

  const tipLeft = hover !== null ? (mapX(hover) / W) * 100 : 50;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
        {label ? <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-kawaii-muted">{label}</p> : <span />}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setHidden((h) => ({ ...h, [s.key]: !h[s.key] }))}
              className="text-[11px] font-bold tabular-nums"
              style={{
                color: hidden[s.key] ? '#6b6280' : s.color,
                textDecoration: hidden[s.key] ? 'line-through' : 'none',
              }}
            >
              {s.label} {formatter(Number(shown[s.key]) || 0)}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={label || '趋势'}
        >
          <defs>
            {fill && active.length === 1 && (
              <linearGradient id={`mt-${gid}-${active[0].key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active[0].color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={active[0].color} stopOpacity="0.02" />
              </linearGradient>
            )}
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = P.top + ih * t;
            return (
              <g key={t}>
                <line x1={P.left} y1={yy} x2={P.left + iw} y2={yy} stroke="rgba(243,236,255,0.09)" />
                <text x={P.left - 8} y={yy + 3} textAnchor="end" fill="#9B90B8" fontSize="10" fontFamily="ui-monospace, monospace">
                  {formatter(maxValue * (1 - t))}
                </text>
              </g>
            );
          })}
          {fill && active.length === 1 && <path d={areaOf(active[0].key)} fill={`url(#mt-${gid}-${active[0].key})`} />}
          {active.map((s) => (
            <path key={s.key} d={pathOf(s.key)} fill="none" stroke={s.color} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hover !== null && shown && !shown.missing && (
            <>
              <line
                x1={mapX(hover)}
                y1={P.top}
                x2={mapX(hover)}
                y2={P.top + ih}
                stroke="rgba(243,236,255,0.38)"
                strokeDasharray="3 3"
              />
              {active.map((s) => (
                <circle
                  key={s.key}
                  cx={mapX(hover)}
                  cy={mapY(Number(shown[s.key]) || 0)}
                  r="3.4"
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth="1.7"
                />
              ))}
            </>
          )}
          <line x1={P.left} y1={P.top + ih} x2={P.left + iw} y2={P.top + ih} stroke="rgba(243,236,255,0.18)" />
          {data.map((d, i) => {
            if (i % labelStep !== 0 && i !== data.length - 1) return null;
            return (
              <text key={d.date} x={mapX(i)} y={H - 6} textAnchor="middle" fill="#9B90B8" fontSize="10" fontFamily="ui-monospace, monospace">
                {d.date.slice(5)}
              </text>
            );
          })}
        </svg>
        {hover !== null && shown && !shown.missing && (
          <div
            className="pointer-events-none absolute z-10 min-w-[9.5rem] rounded-xl border border-kawaii-border/60 bg-[rgb(var(--surface))]/95 px-3 py-2 shadow-xl backdrop-blur-sm"
            style={{
              left: `${Math.min(78, Math.max(8, tipLeft))}%`,
              top: 8,
              transform: tipLeft > 70 ? 'translateX(-100%)' : 'translateX(8px)',
            }}
          >
            <p className="text-[10px] font-bold text-kawaii-muted tabular-nums mb-1">{shown.date}</p>
            {active.map((s) => (
              <p key={s.key} className="text-[11px] font-bold tabular-nums" style={{ color: s.color }}>
                {s.label} {formatter(Number(shown[s.key]) || 0)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
