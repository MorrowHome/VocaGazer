/**
 * 背景层：夜空极光 + 星点 + 落樱
 */

const PETALS = [
  { left: '6%', delay: '0s', duration: '14s', size: 10, drift: 70 },
  { left: '18%', delay: '3s', duration: '18s', size: 13, drift: -50 },
  { left: '31%', delay: '7s', duration: '16s', size: 9, drift: 90 },
  { left: '44%', delay: '1.5s', duration: '20s', size: 12, drift: -80 },
  { left: '57%', delay: '9s', duration: '15s', size: 8, drift: 40 },
  { left: '69%', delay: '4s', duration: '19s', size: 14, drift: -60 },
  { left: '81%', delay: '11s', duration: '17s', size: 10, drift: 85 },
  { left: '92%', delay: '6s', duration: '21s', size: 11, drift: -40 },
  { left: '12%', delay: '13s', duration: '16s', size: 7, drift: 55 },
  { left: '73%', delay: '2s', duration: '22s', size: 9, drift: -95 },
] as const;

function SakuraPetals() {
  return (
    <div className="sakura-layer" aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="sakura-petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size * 0.9,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function BackgroundLayers() {
  return (
    <>
      <div className="bg-base" aria-hidden="true" />
      <div className="bg-soft-glow" aria-hidden="true">
        <div className="soft-glow" />
        <div className="soft-glow" />
        <div className="soft-glow" />
      </div>
      <div className="bg-stars" aria-hidden="true" />
      <SakuraPetals />
    </>
  );
}
