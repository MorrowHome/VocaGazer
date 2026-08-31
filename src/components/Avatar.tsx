'use client';

import { coverImgProps } from '@/lib/utils';

export function Avatar({
  src,
  name,
  size = 40,
  className = '',
}: {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  const img = coverImgProps(src);
  const initial = (name || '?').slice(0, 1);
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-kawaii-cyan/20 to-kawaii-pink/20 ring-1 ring-kawaii-border/30 ${className}`}
      style={{ width: size, height: size }}
    >
      {img.src ? (
        <img {...img} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-xs font-black text-kawaii-cyan">
          {initial}
        </span>
      )}
    </div>
  );
}
