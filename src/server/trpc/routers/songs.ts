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

  getByBvIds: publicProcedure
    .input(z.array(z.string()).max(8))
    .query(async ({ ctx, input }) => {
      if (input.length === 0) return [];
      return ctx.prisma.song.findMany({
        where: { bvId: { in: input } },
        select: { bvId: true, title: true, author: true, picUrl: true },
      });
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

      const [songs, total, allStats] = await Promise.all([
        ctx.prisma.song.findMany({
          where: { author },
          orderBy: { publishTime: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.song.count({ where: { author } }),
        ctx.prisma.song.findMany({
          where: { author },
          select: { statistics: true, score: true },
        }),
      ]);

      let totalPlays = 0;
      let totalScore = 0;
      for (const s of allStats) {
        try {
          totalPlays += JSON.parse(s.statistics).playCount || 0;
        } catch {
          /* skip */
        }
        totalScore += s.score;
      }

      return {
        songs,
        total,
        stats: {
          totalPlays,
          avgScore: total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0,
        },
      };
    }),

  // 获取所有作者列表（按歌曲数排序）
  getAuthors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const grouped = await ctx.prisma.song.groupBy({
        by: ['author'],
        _count: { author: true },
        orderBy: { _count: { author: 'desc' } },
        take: input.limit,
      });
      const names = grouped.map((g) => g.author);
      const avatars = await ctx.prisma.song.findMany({
        where: { author: { in: names }, authorAvatar: { not: null } },
        select: { author: true, authorAvatar: true },
        distinct: ['author'],
      });
      const avatarMap = new Map(avatars.map((s) => [s.author, s.authorAvatar || '']));
      return grouped.map((g) => ({
        author: g.author,
        count: g._count.author,
        avatar: avatarMap.get(g.author) || '',
      }));
    }),

  // 搜索歌曲
  search: publicProcedure
    .input(
      z.object({
        q: z.string().min(1),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        author: z.string().optional(),
        tag: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { q, page, limit, author, tag } = input;
      const skip = (page - 1) * limit;

      const where = {
        AND: [
          {
            OR: [
              { title: { contains: q } },
              { author: { contains: q } },
              { bvId: { contains: q } },
            ],
          },
          ...(author ? [{ author: { contains: author } }] : []),
          ...(tag ? [{ tags: { contains: tag } }] : []),
        ],
      };

      const [songs, total] = await Promise.all([
        ctx.prisma.song.findMany({
          where,
          orderBy: { score: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.song.count({ where }),
      ]);

      return { songs, total };
    }),

  // 获取所有作者列表（按歌曲数排序）
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

  // 按标签筛选歌曲
  getByTag: publicProcedure
    .input(
      z.object({
        tag: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tag, page, limit } = input;
      const skip = (page - 1) * limit;

      // SQLite 中 tags 存为 JSON 字符串数组，用 contains 匹配
      const [songs, total] = await Promise.all([
        ctx.prisma.song.findMany({
          where: { tags: { contains: tag } },
          orderBy: { score: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.song.count({ where: { tags: { contains: tag } } }),
      ]);

      return { songs, total };
    }),

  // 获取所有标签及其出现次数
  getTags: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const songs = await ctx.prisma.song.findMany({
        select: { tags: true },
      });

      // B 站预定义歌姬/引擎标签
      const VOCALOID_TAGS_LIST = [
        '初音未来', '镜音铃', '镜音连', '巡音流歌',
        'MEIKO', 'KAITO',
        '洛天依', '言和', '乐正绫', '乐正龙牙',
        '徵羽摩柯', '墨清弦',
        '星尘', '心华', '赤羽', '苍穹', '诗岸', '海伊', '艾可',
        'GUMI', 'flower', '重音テト',
        '音街ウナ', '歌愛ユキ',
        'vocaloid', 'VOCALOID', 'ボーカロイド',
        'Synthesizer V', 'UTAU', 'CeVIO', 'VOICEVOX',
        '术力口', 'ボカロ',
      ];

      const countMap = new Map<string, number>();
      for (const s of songs) {
        try {
          const tags = JSON.parse(s.tags) as string[];
          for (const tag of tags) {
            if (VOCALOID_TAGS_LIST.some((vt) => tag.includes(vt))) {
              countMap.set(tag, (countMap.get(tag) || 0) + 1);
            }
          }
        } catch {}
      }

      return Array.from(countMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit);
    }),

  similar: publicProcedure
    .input(z.object({ bvId: z.string(), limit: z.number().min(1).max(12).default(8) }))
    .query(async ({ ctx, input }) => {
      const song = await ctx.prisma.song.findUnique({
        where: { bvId: input.bvId },
        select: { id: true, author: true, tags: true, score: true },
      });
      if (!song) return { sameAuthor: [], similar: [] };

      let tags: string[] = [];
      try {
        const parsed = JSON.parse(song.tags);
        if (Array.isArray(parsed)) tags = parsed.filter(Boolean).slice(0, 8);
      } catch { /* ignore */ }

      const sameAuthor = await ctx.prisma.song.findMany({
        where: { author: song.author, id: { not: song.id } },
        orderBy: { score: 'desc' },
        take: 4,
        select: { id: true, bvId: true, title: true, author: true, picUrl: true, score: true, publishTime: true, statistics: true },
      });

      const tagOr = tags.map((t) => ({ tags: { contains: t } }));
      const lo = song.score * 0.7;
      const hi = song.score * 1.3;
      const excludeIds = [song.id, ...sameAuthor.map((s) => s.id)];
      const similar = await ctx.prisma.song.findMany({
        where: {
          id: { notIn: excludeIds },
          OR: [
            ...(tagOr.length ? tagOr : []),
            { score: { gte: lo, lte: hi } },
          ],
        },
        orderBy: { score: 'desc' },
        take: input.limit,
        select: { id: true, bvId: true, title: true, author: true, picUrl: true, score: true, publishTime: true, statistics: true },
      });

      return { sameAuthor, similar: similar.slice(0, input.limit) };
    }),
});
