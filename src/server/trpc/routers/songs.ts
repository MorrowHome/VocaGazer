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

  // 根据作者获取歌曲
  getByAuthor: publicProcedure
    .input(
      z.object({
        author: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { author, page, limit } = input;
      const skip = (page - 1) * limit;

      const [songs, total] = await Promise.all([
        ctx.prisma.song.findMany({
          where: { author },
          orderBy: { publishTime: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.song.count({ where: { author } }),
      ]);

      return { songs, total };
    }),

  // 获取所有作者列表（按歌曲数排序）
  getAuthors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const songs = await ctx.prisma.song.findMany({
        select: { author: true },
      });

      const countMap = new Map<string, number>();
      for (const s of songs) {
        const author = s.author || '未知';
        countMap.set(author, (countMap.get(author) || 0) + 1);
      }

      return Array.from(countMap.entries())
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit);
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
