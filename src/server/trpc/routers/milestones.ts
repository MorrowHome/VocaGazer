/**
 * 里程碑追踪 tRPC 路由
 */
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { getApproachingSongs } from '../../services/milestone';

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

  /** 获取正在接近里程碑的歌曲 */
  getApproaching: publicProcedure.query(async ({ ctx }) => {
    return getApproachingSongs(ctx.prisma);
  }),

  /** 获取统计数据：已达成数、接近中的歌曲数 */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [totalMilestones, totalSongs] = await Promise.all([
      ctx.prisma.songMilestone.count(),
      ctx.prisma.song.count(),
    ]);

    const approaching = await getApproachingSongs(ctx.prisma);

    return {
      totalMilestones,
      totalApproaching: approaching.length,
      totalSongs,
      byThreshold: {
        '100000': {
          achieved: await ctx.prisma.songMilestone.count({ where: { threshold: 100000 } }),
          approaching: approaching.filter((a) => a.threshold === 100000).length,
        },
        '1000000': {
          achieved: await ctx.prisma.songMilestone.count({ where: { threshold: 1000000 } }),
          approaching: approaching.filter((a) => a.threshold === 1000000).length,
        },
        '10000000': {
          achieved: await ctx.prisma.songMilestone.count({ where: { threshold: 10000000 } }),
          approaching: approaching.filter((a) => a.threshold === 10000000).length,
        },
      },
    };
  }),
});
