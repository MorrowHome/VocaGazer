export const BUNDLED_DEFAULT_BG = '/bg-default.jpg';

export function rainTextureSrc(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return src;
  return `/api/cover-proxy?u=${encodeURIComponent(src)}`;
}
