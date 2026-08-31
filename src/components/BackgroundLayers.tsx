/**
 * 背景层：渐变光晕 + 星点。雨幕由 RainGlass 画在这一层上面。
 */

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
    </>
  );
}
