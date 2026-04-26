/**
 * 歌曲 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const songsRouter = router({
  // 获取最新歌曲列表
  getLatest: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [songs, total] = await Promise.all([
        ctx.prisma.song.findMany({
          orderBy: { publishTime: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.song.count(),
      ]);

      return {
        songs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 根据 BV 号获取歌曲详情
  getByBvId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const song = await ctx.prisma.song.findUnique({
        where: { bvId: input },
        include: {
          dailyStats: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
      });

      if (!song) {
        throw new Error('歌曲未找到');
      }

      return song;
    }),

  // 获取高评分歌曲
  getTopRated: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        days: z.number().min(1).max(365).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, days } = input;

      const where = days
        ? {
            publishTime: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          }
        : {};

      const songs = await ctx.prisma.song.findMany({
        where,
        orderBy: { score: 'desc' },
        take: limit,
      });

      return songs;
    }),
});
