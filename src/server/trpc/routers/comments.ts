/**
 * 热评 tRPC 路由（短时缓存，减少打 B 站）
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getVideoDetail, getVideoComments } from '@/server/services/bilibili/client';
import type { HotCommentsResult } from '@/server/services/bilibili/types';

const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const cache = new Map<string, { expires: number; value: HotCommentsResult }>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

export const commentsRouter = router({
  getTop: publicProcedure
    .input(z.string())
    .query(async ({ input: bvId }) => {
      const hit = cache.get(bvId);
      if (hit && hit.expires > Date.now()) return hit.value;

      try {
        const detail = await withTimeout(getVideoDetail(bvId), FETCH_TIMEOUT_MS);
        if (!detail) return { comments: [], total: 0 };

        const raw = await withTimeout(getVideoComments(detail.aid, 3), FETCH_TIMEOUT_MS);
        const value: HotCommentsResult = {
          total: raw.total,
          comments: raw.comments.map((c) => ({
            rpid: c.rpid,
            mid: c.mid,
            uname: c.uname,
            content: c.content,
            likes: c.likes,
            ctime: c.ctime,
            avatar: '',
          })),
        };
        cache.set(bvId, { expires: Date.now() + CACHE_TTL_MS, value });
        return value;
      } catch {
        return { comments: [], total: 0 };
      }
    }),
});
