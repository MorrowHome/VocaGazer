/**
 * 里程碑追踪 tRPC 路由
 */
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const milestonesRouter = router({
  /** 获取一首歌的里程碑 */
  getBySong: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.prisma.songMilestone.findMany({
        where: { songId: input },
        orderBy: { threshold: 'asc' },
      });
      return milestones;
    }),

  /** 获取所有已达成里程碑（含歌曲信息） */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const milestones = await ctx.prisma.songMilestone.findMany({
      orderBy: { achievedAt: 'desc' },
      include: {
        song: {
          select: { title: true, author: true, bvId: true },
        },
      },
    });
    return milestones;
  }),
});
