/**
 * 背景层：柔和渐变 + 可爱星星点缀
 */

function FloatingStars() {
  const stars = Array.from({ length: 15 }, (_, i) => {
    const symbols = ['✦', '✧', '⋆', '✶', '·'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 25}s`,
      duration: `${18 + Math.random() * 20}s`,
      symbol: symbols[i % symbols.length],
    };
  });

  return (
    <div aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="floating-star"
          style={{
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        >
          {s.symbol}
        </span>
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
      <div className="bg-dots" aria-hidden="true" />
      <FloatingStars />
    </>
  );
}
