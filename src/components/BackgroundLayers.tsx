/**
 * 背景层：深度 + 光晕 + 粒子 + 漂浮几何 + 极光
 */

function ParticleField() {
  const stars = Array.from({ length: 45 }, (_, i) => {
    const colors = ['star-cyan', 'star-pink', 'star-purple', 'star-white'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 20}s`,
      duration: `${15 + Math.random() * 25}s`,
      size: `${1 + Math.random() * 2.5}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  return (
    <div className="particle-field" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className={`star ${s.color}`}
          style={{
            left: s.left,
            bottom: '-10px',
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

function FloatingGeometries() {
  return (
    <div className="floating-geo" aria-hidden="true">
      {/* 左上 */}
      <div className="geo geo-circle" style={{ top: '12%', left: '5%', animationDelay: '0s' }} />
      {/* 右上 */}
      <div className="geo geo-diamond" style={{ top: '8%', right: '8%', animationDelay: '-3s' }} />
      {/* 中左 */}
      <div className="geo geo-triangle" style={{ top: '45%', left: '3%', animationDelay: '-6s' }} />
      {/* 中右 */}
      <div className="geo geo-ring" style={{ top: '50%', right: '4%', animationDelay: '-9s', opacity: 0.12 }}>
        <div className="geo-ring-inner" />
      </div>
      {/* 左下 */}
      <div className="geo geo-circle" style={{ top: '75%', left: '7%', animationDelay: '-4s', width: '40px', height: '40px', opacity: 0.1 }} />
      {/* 右下 */}
      <div className="geo geo-diamond" style={{ top: '80%', right: '6%', animationDelay: '-2s', width: '30px', height: '30px', opacity: 0.12 }} />
    </div>
  );
}

export function BackgroundLayers() {
  return (
    <>
      <div className="bg-deep" aria-hidden="true" />
      <div className="bg-blobs" aria-hidden="true">
        <div className="bg-blob" />
        <div className="bg-blob" />
        <div className="bg-blob" />
      </div>
      <div className="bg-aurora" aria-hidden="true">
        <div className="aurora-wave" />
        <div className="aurora-wave" />
      </div>
      <div className="bg-grid" aria-hidden="true" />
      <ParticleField />
      <FloatingGeometries />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="scanline-overlay" aria-hidden="true" />
    </>
  );
}
