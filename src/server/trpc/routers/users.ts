/**
 * 用户 tRPC 路由
 */
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { signToken } from '@/lib/auth';

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
        _count: { select: { posts: true, favorites: true } },
      },
    });

    if (!user) {
      throw new Error('用户未找到');
    }

    return user;
  }),

  myPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: { authorId: ctx.user.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }),

  // 注册
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(2).max(30),
        email: z.string().email(),
        password: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否已存在
      const existing = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });
      if (existing) {
        throw new Error('用户名或邮箱已存在');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash,
        },
      });

      const token = signToken({ userId: user.id, role: user.role });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    }),

  // 登录
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new Error('邮箱或密码错误');
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error('邮箱或密码错误');
      }

      // 更新最后登录时间
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const token = signToken({ userId: user.id, role: user.role });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
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
