/**
 * 进程内短 TTL 缓存。单 PM2 实例足够；生成排行后主动失效。
 */

type Entry<T> = { expires: number; value: T };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return undefined;
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { expires: Date.now() + ttlMs, value });
}

export function cacheInvalidate(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export const RANKING_CACHE_TTL_MS = 5 * 60 * 1000;
export const HOMEPAGE_CACHE_TTL_MS = 5 * 60 * 1000;
