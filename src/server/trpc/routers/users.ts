/**
 * 用户 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const usersRouter = router({
  // 获取当前登录用户信息
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new Error('用户未找到');
    }

    return user;
  }),

  // 根据 ID 获取用户公开信息
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new Error('用户未找到');
      }

      return user;
    }),

  // 更新用户资料
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(2).max(30).optional(),
        avatar: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });

      return user;
    }),
});
