/**
 * 炫酷背景层：烟花 + 粒子 + 几何线条 + 霓虹网格
 */

// ─── 烟花粒子 ───

function Fireworks() {
  const bursts = Array.from({ length: 6 }, (_, i) => {
    const colors = ['#06B6D4', '#EC4899', '#A855F7', '#22D3EE', '#F97316', '#10B981'];
    const x = 10 + Math.random() * 80;
    return { id: i, x, delay: `${2 + i * 3.5}s`, color: colors[i] };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
      {bursts.map((b) => (
        <div key={b.id} className="firework-burst" style={{ left: `${b.x}%`, top: '50%', animationDelay: b.delay, '--burst-color': b.color } as React.CSSProperties}>
          {Array.from({ length: 12 }, (_, j) => (
            <div
              key={j}
              className="firework-particle"
              style={{ '--angle': `${j * 30}deg`, '--delay': `${j * 0.05}s` } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── 粒子系统 ───

function ParticleField() {
  const stars = Array.from({ length: 60 }, (_, i) => {
    const colors = ['star-cyan', 'star-pink', 'star-purple', 'star-white', 'star-yellow', 'star-green'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 30}s`,
      duration: `${18 + Math.random() * 30}s`,
      size: `${1 + Math.random() * 3}px`,
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

// ─── 霓虹几何线条 ───

function GeometryLines() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {/* 旋转立方体线条 */}
      <svg className="absolute top-[15%] left-[5%] opacity-15 geo-spin-slow" width="120" height="120" viewBox="0 0 100 100">
        <rect x="5" y="5" width="90" height="90" rx="10" stroke="rgb(6,210,240)" strokeWidth="1.5" fill="none" />
        <rect x="15" y="15" width="70" height="70" rx="6" stroke="rgb(255,50,150)" strokeWidth="1" fill="none" />
        <line x1="5" y1="5" x2="15" y2="15" stroke="rgb(160,50,220)" strokeWidth="1" />
        <line x1="95" y1="5" x2="85" y2="15" stroke="rgb(160,50,220)" strokeWidth="1" />
        <line x1="5" y1="95" x2="15" y2="85" stroke="rgb(160,50,220)" strokeWidth="1" />
        <line x1="95" y1="95" x2="85" y2="85" stroke="rgb(160,50,220)" strokeWidth="1" />
      </svg>

      {/* 大X线条 */}
      <svg className="absolute top-[60%] right-[8%] opacity-10 geo-spin-reverse" width="100" height="100" viewBox="0 0 100 100">
        <line x1="10" y1="10" x2="90" y2="90" stroke="rgb(255,50,150)" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="10" x2="10" y2="90" stroke="rgb(6,210,240)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* 三角形 */}
      <svg className="absolute top-[30%] right-[12%] opacity-12 geo-float-up" width="80" height="80" viewBox="0 0 80 80">
        <polygon points="40,5 75,70 5,70" stroke="rgb(160,50,220)" strokeWidth="1.5" fill="none" />
        <line x1="40" y1="5" x2="40" y2="70" stroke="rgb(160,50,220)" strokeWidth="0.8" opacity="0.4" />
      </svg>

      {/* 六边形 */}
      <svg className="absolute bottom-[15%] left-[8%] opacity-10 geo-spin-slow" width="90" height="90" viewBox="0 0 90 90">
        <polygon points="45,2 84,24 84,66 45,88 6,66 6,24" stroke="rgb(6,210,240)" strokeWidth="1.5" fill="none" />
        <polygon points="45,12 74,29 74,61 45,78 16,61 16,29" stroke="rgb(255,50,150)" strokeWidth="0.8" fill="none" opacity="0.5" />
      </svg>

      {/* 交叉网格线条 */}
      <svg className="absolute top-[10%] left-[50%] -translate-x-1/2 opacity-8 geo-scroll" width="200" height="200" viewBox="0 0 200 200">
        {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x - 10} y2="200" stroke="rgb(6,210,240)" strokeWidth="0.8" opacity="0.5" />
        ))}
        {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y + 10} stroke="rgb(255,50,150)" strokeWidth="0.8" opacity="0.5" />
        ))}
      </svg>

      {/* 同心圆 */}
      <svg className="absolute bottom-[30%] right-[5%] opacity-8 geo-pulse" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="rgb(6,210,240)" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="30" stroke="rgb(255,50,150)" strokeWidth="1" fill="none" opacity="0.6" />
        <circle cx="50" cy="50" r="15" stroke="rgb(160,50,220)" strokeWidth="1" fill="none" opacity="0.4" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgb(6,210,240)" strokeWidth="0.5" opacity="0.3" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgb(6,210,240)" strokeWidth="0.5" opacity="0.3" />
      </svg>

      {/* 波浪线 */}
      <svg className="absolute bottom-[5%] left-[20%] opacity-10 geo-waves" width="200" height="40" viewBox="0 0 200 40">
        <path d="M0 20 Q25 0, 50 20 T100 20 T150 20 T200 20" stroke="rgb(6,210,240)" strokeWidth="1.5" fill="none" />
        <path d="M0 25 Q25 5, 50 25 T100 25 T150 25 T200 25" stroke="rgb(255,50,150)" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>

      {/* 霓虹扫描线前景 */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgb(6,210,240)" strokeWidth="0.5" opacity={y % 10 === 0 ? 0.6 : 0.2} />
        ))}
      </svg>
    </div>
  );
}

// ─── 闪烁小星星 ───

function TwinkleStars() {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    size: `${4 + Math.random() * 6}px`,
    color: i % 3 === 0 ? '#06B6D4' : i % 3 === 1 ? '#EC4899' : '#A855F7',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="twinkle-star-static"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 ${parseInt(s.size) * 2}px ${s.color}`,
            animationDelay: s.delay,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── 主背景 ───

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
      <TwinkleStars />
      <GeometryLines />
      <div className="bg-grid" aria-hidden="true" />
      <ParticleField />
      <Fireworks />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="scanline-overlay" aria-hidden="true" />
    </>
  );
}
