/**
 * 背景层：深度光晕 + 精致几何 + 粒子
 */

function ParticleField() {
  const stars = Array.from({ length: 40 }, (_, i) => {
    const colors = ['star-cyan', 'star-pink', 'star-purple', 'star-white'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 25}s`,
      duration: `${20 + Math.random() * 25}s`,
      size: `${1 + Math.random() * 2.5}px`,
      color: colors[i % colors.length],
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

function GeometricArt() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {/* 大号旋转六边形 */}
      <svg className="absolute top-[10%] right-[5%] opacity-[0.12] geo-spin-slow" width="160" height="160" viewBox="0 0 160 160">
        <polygon points="80,5 144,43 144,117 80,155 16,117 16,43"
          stroke="rgb(6,210,240)" strokeWidth="1.2" fill="none" />
        <polygon points="80,20 128,50 128,110 80,140 32,110 32,50"
          stroke="rgb(255,50,150)" strokeWidth="0.8" fill="none" opacity="0.5" />
        <line x1="80" y1="5" x2="80" y2="155" stroke="rgb(160,50,220)" strokeWidth="0.5" opacity="0.3" />
        <line x1="16" y1="80" x2="144" y2="80" stroke="rgb(160,50,220)" strokeWidth="0.5" opacity="0.3" />
      </svg>

      {/* 大X */}
      <svg className="absolute bottom-[20%] left-[3%] opacity-10 geo-spin-reverse" width="120" height="120" viewBox="0 0 120 120">
        <line x1="10" y1="10" x2="110" y2="110" stroke="rgb(255,50,150)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="110" y1="10" x2="10" y2="110" stroke="rgb(6,210,240)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="20" stroke="rgb(160,50,220)" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>

      {/* 方格透视网格 */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" preserveAspectRatio="none">
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="200" y2={i * 10 + 5} stroke="rgb(6,210,240)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10 + 3} y2="200" stroke="rgb(255,50,150)" strokeWidth="0.5" />
        ))}
      </svg>

      {/* 波浪线条 */}
      <svg className="absolute bottom-[8%] left-[10%] opacity-15 geo-waves" width="300" height="50" viewBox="0 0 300 50" style={{ animationDuration: '10s' }}>
        <path d="M0 25 C40 0, 80 50, 120 25 S200 0, 240 25 S280 50, 300 25"
          stroke="rgb(6,210,240)" strokeWidth="1.5" fill="none" />
        <path d="M0 30 C40 5, 80 55, 120 30 S200 5, 240 30 S280 55, 300 30"
          stroke="rgb(255,50,150)" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>

      {/* 顶部装饰弧线 */}
      <svg className="absolute top-0 left-0 w-full opacity-[0.06]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 Q300 0, 600 100 T1200 50 L1200 0 L0 0Z"
          fill="rgb(6,210,240)" opacity="0.3" />
        <path d="M0 200 Q400 50, 800 120 T1200 80 L1200 0 L0 0Z"
          fill="rgb(255,50,150)" opacity="0.2" />
      </svg>

      {/* 底部装饰弧线 */}
      <svg className="absolute bottom-0 left-0 w-full opacity-[0.06]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 0 Q300 200, 600 100 T1200 150 L1200 200 L0 200Z"
          fill="rgb(160,50,220)" opacity="0.3" />
      </svg>
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
      <GeometricArt />
      <div className="bg-grid" aria-hidden="true" />
      <ParticleField />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="scanline-overlay" aria-hidden="true" />
    </>
  );
}
