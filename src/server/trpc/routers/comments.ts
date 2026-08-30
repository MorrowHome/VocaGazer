/**
 * 热评 tRPC 路由（短时缓存，减少打 B 站）
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getVideoDetail, getVideoComments } from '@/server/services/bilibili/client';
import type { HotCommentsResult } from '@/server/services/bilibili/types';

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { expires: number; value: HotCommentsResult }>();

export const commentsRouter = router({
  /** 获取一首歌的 Top 3 热评 */
  getTop: publicProcedure
    .input(z.string())
    .query(async ({ input: bvId }) => {
      const hit = cache.get(bvId);
      if (hit && hit.expires > Date.now()) return hit.value;

      const detail = await getVideoDetail(bvId);
      if (!detail) return { comments: [], total: 0 };

      const value = await getVideoComments(detail.aid, 3);
      cache.set(bvId, { expires: Date.now() + CACHE_TTL_MS, value });
      return value;
    }),
});
