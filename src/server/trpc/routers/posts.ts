/**
 * 论坛帖子 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';

const POST_TYPES = ['review', 'recommend', 'discussion', 'question'] as const;

export const postsRouter = router({
  // 获取帖子列表
  getLatest: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        type: z.enum(POST_TYPES).optional(),
        sort: z.enum(['latest', 'hottest']).default('latest'),
        q: z.string().max(80).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, type, sort, q } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        isDeleted: false,
        ...(type ? { type } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { content: { contains: q } },
              ],
            }
          : {}),
      };

      const orderBy =
        sort === 'hottest'
          ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }]
          : [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }];

      const [posts, total] = await Promise.all([
        ctx.prisma.post.findMany({
          where: where as any,
          orderBy,
          skip,
          take: limit,
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
            _count: {
              select: { replies: true },
            },
          },
        }),
        ctx.prisma.post.count({ where: where as any }),
      ]);

      return {
        posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // 获取帖子详情
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, username: true, avatar: true },
              },
            },
          },
        },
      });

      if (!post || post.isDeleted) {
        throw new Error('帖子未找到');
      }

      // 增加浏览量
      await ctx.prisma.post.update({
        where: { id: input },
        data: { views: { increment: 1 } },
      });

      const likedByMe = ctx.user
        ? Boolean(
            await ctx.prisma.postLike.findUnique({
              where: { postId_userId: { postId: post.id, userId: ctx.user.id } },
            }),
          )
        : false;

      const likedReplyIds = ctx.user
        ? (
            await ctx.prisma.replyLike.findMany({
              where: {
                userId: ctx.user.id,
                replyId: { in: post.replies.map((r) => r.id) },
              },
              select: { replyId: true },
            })
          ).map((r) => r.replyId)
        : [];

      return { ...post, likedByMe, likedReplyIds };
    }),

  getBySong: publicProcedure
    .input(z.string().min(3).max(20))
    .query(async ({ ctx, input }) => {
      const needle = input.replace(/["%_]/g, '');
      if (needle.length < 3) return [];
      return ctx.prisma.post.findMany({
        where: {
          isDeleted: false,
          relatedSongs: { contains: `"${needle}"` },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          author: { select: { username: true } },
          _count: { select: { replies: true } },
        },
      });
    }),

  // 创建帖子（需登录）
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2).max(100),
        content: z.string().min(10).max(10000),
        type: z.enum(POST_TYPES),
        tags: z.array(z.string()).max(10).default([]),
        relatedSongs: z.array(z.string()).max(5).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          ...input,
          tags: JSON.stringify(input.tags),
          relatedSongs: JSON.stringify(input.relatedSongs),
          authorId: ctx.user.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      return post;
    }),

  // 编辑自己的帖子
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(2).max(100).optional(),
        content: z.string().min(10).max(10000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({ where: { id: input.id } });
      if (!post || post.isDeleted) throw new Error('帖子未找到');
      if (post.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('无权限编辑此帖子');
      }
      const { id, ...data } = input;
      return ctx.prisma.post.update({ where: { id }, data });
    }),

  // 删除帖子（管理员或本人）
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input },
      });

      if (!post) {
        throw new Error('帖子未找到');
      }

      if (post.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error('无权限删除此帖子');
      }

      await ctx.prisma.post.update({
        where: { id: input },
        data: { isDeleted: true },
      });

      return { success: true };
    }),

  // 置顶帖子（管理员）
  pin: adminProcedure
    .input(z.object({ id: z.string(), isPinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.update({
        where: { id: input.id },
        data: { isPinned: input.isPinned },
      });

      return post;
    }),

  // 回复帖子（需登录）
  reply: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reply = await ctx.prisma.reply.create({
        data: {
          postId: input.postId,
          content: input.content,
          authorId: ctx.user.id,
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      });

      return reply;
    }),

  // 点赞 / 取消点赞帖子
  like: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.postLike.findUnique({
        where: { postId_userId: { postId: input, userId: ctx.user.id } },
      });

      if (existing) {
        await ctx.prisma.$transaction([
          ctx.prisma.postLike.delete({ where: { id: existing.id } }),
          ctx.prisma.post.update({
            where: { id: input },
            data: { likes: { decrement: 1 } },
          }),
        ]);
        const post = await ctx.prisma.post.findUnique({ where: { id: input } });
        if (post && post.likes < 0) {
          await ctx.prisma.post.update({ where: { id: input }, data: { likes: 0 } });
        }
        return { liked: false };
      }

      await ctx.prisma.$transaction([
        ctx.prisma.postLike.create({ data: { postId: input, userId: ctx.user.id } }),
        ctx.prisma.post.update({
          where: { id: input },
          data: { likes: { increment: 1 } },
        }),
      ]);
      return { liked: true };
    }),

  likeReply: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: replyId }) => {
      const existing = await ctx.prisma.replyLike.findUnique({
        where: { replyId_userId: { replyId, userId: ctx.user.id } },
      });
      if (existing) {
        await ctx.prisma.$transaction([
          ctx.prisma.replyLike.delete({ where: { id: existing.id } }),
          ctx.prisma.reply.update({
            where: { id: replyId },
            data: { likes: { decrement: 1 } },
          }),
        ]);
        const reply = await ctx.prisma.reply.findUnique({ where: { id: replyId } });
        if (reply && reply.likes < 0) {
          await ctx.prisma.reply.update({ where: { id: replyId }, data: { likes: 0 } });
        }
        return { liked: false };
      }
      await ctx.prisma.$transaction([
        ctx.prisma.replyLike.create({ data: { replyId, userId: ctx.user.id } }),
        ctx.prisma.reply.update({
          where: { id: replyId },
          data: { likes: { increment: 1 } },
        }),
      ]);
      return { liked: true };
    }),
});
