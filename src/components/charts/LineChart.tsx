'use client';

export function LineChart({
  data,
  height,
  color,
  gradientId,
  maxValue,
  formatter,
  label,
  gaps = false,
}: {
  data: Array<{ date: string; value: number; missing?: boolean }>;
  height: number;
  color: string;
  gradientId: string;
  maxValue: number;
  formatter: (v: number) => string;
  label: string;
  gaps?: boolean;
}) {
  if (data.length < 2) {
    return <p className="text-xs text-kawaii-muted font-medium">数据不足，待夜间刷新后再看生涯曲线</p>;
  }

  const W = 800;
  const H = height;
  const P = { top: 20, right: 8, bottom: 24, left: 52 };
  const iw = W - P.left - P.right;
  const ih = H - P.top - P.bottom;

  const mapX = (i: number) => P.left + (i / (data.length - 1)) * iw;
  const mapY = (v: number) => P.top + ih - (v / Math.max(maxValue, 1)) * ih;

  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];
  data.forEach((d, i) => {
    if (gaps && d.missing) {
      if (current.length >= 2) segments.push(current);
      current = [];
      return;
    }
    current.push({ x: mapX(i), y: mapY(d.value) });
  });
  if (current.length >= 2) segments.push(current);

  const toPath = (pts: Array<{ x: number; y: number }>) => {
    let lineD = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      lineD += ` C${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return lineD;
  };

  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <div>
      <p className="text-[10px] text-kawaii-muted font-bold mb-2">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const yy = P.top + ih * pct;
          return (
            <g key={pct}>
              <line x1={P.left} y1={yy} x2={P.left + iw} y2={yy} stroke="#ECECF0" strokeWidth="1" strokeDasharray="3 3" />
              <text x={P.left - 6} y={yy + 3} textAnchor="end" fill="#B0A8C0" fontSize="9" fontFamily="system-ui">
                {formatter(maxValue * (1 - pct))}
              </text>
            </g>
          );
        })}
        {segments.map((pts, si) => {
          const lineD = toPath(pts);
          const areaD = `${lineD} L${pts[pts.length - 1].x},${P.top + ih} L${pts[0].x},${P.top + ih} Z`;
          return (
            <g key={si}>
              <path d={areaD} fill={`url(#${gradientId})`} />
              <path d={lineD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {data.map((d, i) => {
          if (d.missing) return null;
          return (
            <circle key={i} cx={mapX(i)} cy={mapY(d.value)} r="2.5" fill="#fff" stroke={color} strokeWidth="1.5" />
          );
        })}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={mapX(i)} y={H - 4} textAnchor="middle" fill="#B0A8C0" fontSize="9" fontFamily="system-ui">
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
