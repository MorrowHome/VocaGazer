/**
 * 推荐系统 tRPC 路由
 */
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { chinaCalendarDay, chinaWeekRange } from '@/lib/time';

export const recommendRouter = router({
  getRecommendations: publicProcedure.query(async ({ ctx }) => {
    const today = chinaCalendarDay();
    const week = chinaWeekRange();

    const [editorRows, weekRank, recentPicks] = await Promise.all([
      ctx.prisma.editorPick.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { song: true },
        take: 12,
      }),
      ctx.prisma.ranking.findMany({
        where: {
          period: 'weekly',
          date: week.snapDate,
          isFinal: false,
        },
        orderBy: { rank: 'asc' },
        take: 12,
        include: { song: true },
      }),
      ctx.prisma.song.findMany({
        where: { publishTime: { gte: today.start } },
        orderBy: { publishTime: 'desc' },
        take: 12,
      }),
    ]);

    let weeklyRising = weekRank.map((e) => e.song).filter(Boolean);
    if (weeklyRising.length === 0) {
      const latestWeek = await ctx.prisma.ranking.findFirst({
        where: { period: 'weekly' },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      if (latestWeek) {
        const rows = await ctx.prisma.ranking.findMany({
          where: { period: 'weekly', date: latestWeek.date },
          orderBy: { rank: 'asc' },
          take: 12,
          include: { song: true },
        });
        weeklyRising = rows.map((e) => e.song).filter(Boolean);
      }
    }

    return {
      editorPicks: editorRows.map((p) => ({ ...p.song, editorNote: p.note })),
      weeklyRising,
      todayNew: recentPicks.length ? recentPicks : await ctx.prisma.song.findMany({
        orderBy: { publishTime: 'desc' },
        take: 12,
      }),
    };
  }),

  forYou: protectedProcedure.query(async ({ ctx }) => {
    const favs = await ctx.prisma.favorite.findMany({
      where: { userId: ctx.user.id },
      include: { song: true },
      take: 20,
    });
    if (favs.length === 0) return { songs: [], reason: 'empty' as const };

    const authors = Array.from(new Set(favs.map((f) => f.song.author)));
    const exclude = favs.map((f) => f.songId);
    const songs = await ctx.prisma.song.findMany({
      where: { author: { in: authors }, id: { notIn: exclude } },
      orderBy: { score: 'desc' },
      take: 12,
    });
    return { songs, reason: 'favorites' as const };
  }),
});
