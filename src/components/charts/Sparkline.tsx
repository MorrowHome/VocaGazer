'use client';

export function Sparkline({
  values,
  color = '#FF8BB8',
  className = 'w-full h-24',
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  if (values.length < 2) return <p className="text-xs text-kawaii-muted">暂无趋势</p>;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const W = 320;
  const H = 80;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 8) - 4;
    return `${x},${y}`;
  });
  const d = `M${pts.join(' L')}`;
  const area = `${d} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none">
      <path d={area} fill={color} opacity="0.15" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
