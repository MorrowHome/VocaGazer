/**
 * 热评 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getVideoDetail, getVideoComments } from '@/server/services/bilibili/client';

export const commentsRouter = router({
  /** 获取一首歌的 Top 3 热评 */
  getTop: publicProcedure
    .input(z.string()) // bvId
    .query(async ({ input: bvId }) => {
      const detail = await getVideoDetail(bvId);
      if (!detail) return { comments: [], total: 0 };

      return getVideoComments(detail.aid, 3);
    }),
});
