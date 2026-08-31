'use client';

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

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 96;

function point(axisIndex: number, value: number) {
  const angle = (Math.PI * 2 * axisIndex) / AXES.length - Math.PI / 2;
  const r = (Math.max(0, Math.min(100, value)) / 100) * RADIUS;
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
}: {
  song: Record<string, number>;
  baseline: Record<string, number>;
}) {
  const rings = [25, 50, 75, 100];
  const songVec = song as Record<Axis, number>;
  const baseVec = baseline as Record<Axis, number>;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[280px] h-auto mx-auto">
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={polygon(Object.fromEntries(AXES.map((a) => [a, pct])) as Record<Axis, number>)}
          fill="none"
          stroke="rgba(179,136,255,0.22)"
          strokeWidth="1"
        />
      ))}
      {AXES.map((_, i) => {
        const outer = point(i, 100);
        return (
          <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="rgba(179,136,255,0.2)" strokeWidth="1" />
        );
      })}
      <polygon points={polygon(baseVec)} fill="rgba(57,190,185,0.16)" stroke="#39BEB9" strokeWidth="1.5" strokeDasharray="4 3" />
      <polygon points={polygon(songVec)} fill="rgba(255,107,157,0.28)" stroke="#FF6B9D" strokeWidth="2" />
      {AXES.map((axis, i) => {
        const labelPt = point(i, 118);
        return (
          <text key={axis} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle" fill="#6b6580" fontSize="11" fontWeight="700">
            {LABELS[axis]}
          </text>
        );
      })}
    </svg>
  );
}
