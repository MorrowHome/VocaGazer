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

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim();
      const user = await ctx.prisma.user.findUnique({ where: { email } });
      const generic = { ok: true as const };

      if (!user) return generic;

      const recent = await ctx.prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recent && !recent.usedAt) return generic;

      const { newResetToken, hashResetToken, appBaseUrl, sendPasswordResetEmail } = await import(
        '@/server/services/mail'
      );
      const token = newResetToken();
      const tokenHash = hashResetToken(token);
      await ctx.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        console.error('[mail] 发送重置邮件失败:', err);
        console.log('[mail] 备用重置链接:', resetUrl);
      }

      return generic;
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(16).max(128),
        password: z.string().min(6).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { hashResetToken } = await import('@/server/services/mail');
      const tokenHash = hashResetToken(input.token);
      const record = await ctx.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new Error('重置链接无效或已过期，请重新申请');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        ctx.prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { ok: true };
    }),
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

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(100),
        newPassword: z.string().min(6).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.currentPassword === input.newPassword) {
        throw new Error('新密码不能与当前密码相同');
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) {
        throw new Error('用户未找到');
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new Error('当前密码不正确');
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return { ok: true };
    }),
});
