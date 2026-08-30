/**
 * 歌曲收藏
 */
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

export const favoritesRouter = router({
  toggle: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: songId }) => {
      const existing = await ctx.prisma.favorite.findUnique({
        where: { songId_userId: { songId, userId: ctx.user.id } },
      });
      if (existing) {
        await ctx.prisma.favorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await ctx.prisma.favorite.create({ data: { songId, userId: ctx.user.id } });
      return { favorited: true };
    }),

  isFavorited: publicProcedure.input(z.string()).query(async ({ ctx, input: songId }) => {
    if (!ctx.user) return false;
    const row = await ctx.prisma.favorite.findUnique({
      where: { songId_userId: { songId, userId: ctx.user.id } },
    });
    return Boolean(row);
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.favorite.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      include: { song: true },
    });
  }),
});
