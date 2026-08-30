/**
 * 数据分析 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { chinaCalendarDay, shiftChinaDays } from '@/lib/time';

function parseStats(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

const rangeSchema = z.enum(['7d', '30d', '90d', 'all']).default('all');

function getDateRange(range: string): Date | null {
  if (range === 'all') return null;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range] ?? 7;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export const analyticsRouter = router({
  // 获取首页全量数据
  getHomepage: publicProcedure.query(async ({ ctx }) => {
    const { start: todayStart } = chinaCalendarDay();
    const weekStart = chinaCalendarDay(shiftChinaDays(new Date(), -7)).start;

    const [totalSongs, todaySongs, weekSongs, latestSongs, dailySnap, weeklySnap, statsRows] =
      await Promise.all([
        ctx.prisma.song.count(),
        ctx.prisma.song.count({ where: { publishTime: { gte: todayStart } } }),
        ctx.prisma.song.count({ where: { publishTime: { gte: weekStart } } }),
        ctx.prisma.song.findMany({ orderBy: { publishTime: 'desc' }, take: 20 }),
        ctx.prisma.ranking.findFirst({
          where: { period: 'daily' },
          orderBy: { date: 'desc' },
          select: { date: true },
        }),
        ctx.prisma.ranking.findFirst({
          where: { period: 'weekly' },
          orderBy: { date: 'desc' },
          select: { date: true },
        }),
        ctx.prisma.song.findMany({ select: { statistics: true } }),
      ]);

    const [dailyEntries, weeklyEntries] = await Promise.all([
      dailySnap
        ? ctx.prisma.ranking.findMany({
            where: { period: 'daily', date: dailySnap.date },
            orderBy: { rank: 'asc' },
            take: 10,
            include: { song: true },
          })
        : Promise.resolve([]),
      weeklySnap
        ? ctx.prisma.ranking.findMany({
            where: { period: 'weekly', date: weeklySnap.date },
            orderBy: { rank: 'asc' },
            take: 10,
            include: { song: true },
          })
        : Promise.resolve([]),
    ]);

    const dailyRanking = dailyEntries.map((e) => e.song).filter(Boolean);
    const weeklyRanking = weeklyEntries.map((e) => e.song).filter(Boolean);

    const latestSong = latestSongs.length > 0 ? latestSongs[0] : null;
    const weeklyHotSong = weeklyRanking.length > 0 ? weeklyRanking[0] : null;

    let totalPlayCount = 0;
    for (const row of statsRows) {
      try {
        const s = JSON.parse(row.statistics);
        totalPlayCount += s.playCount || 0;
      } catch {
        /* skip */
      }
    }

    return {
      stats: { totalSongs, todaySongs, totalPlayCount, weekSongs },
      latestSong,
      weeklyHotSong,
      latestSongs,
      dailyRanking,
      weeklyRanking,
    };
  }),

  // 获取数据分析页数据（支持时间范围过滤）
  getAnalytics: publicProcedure
    .input(z.object({ range: rangeSchema }))
    .query(async ({ ctx, input }) => {
      const { range } = input;
      const dateFilter = getDateRange(range);
      const where = dateFilter ? { publishTime: { gte: dateFilter } } : {};

      const allSongs = await ctx.prisma.song.findMany({
        where,
        orderBy: { publishTime: 'desc' },
      });

      // ── 基础聚合 ──
      let totalPlayCount = 0;
      let totalLikeCount = 0;
      let totalCoinCount = 0;
      let totalFavCount = 0;
      let totalShareCount = 0;
      let totalCommentCount = 0;

      const artistMap = new Map<string, { count: number; totalPlays: number; totalLikes: number }>();
      const tagMap = new Map<string, number>();
      const monthMap = new Map<string, number>();
      const weekMap = new Map<string, number>();
      const scoreDist = [0, 0, 0, 0, 0];
      const artistScoreMap = new Map<string, { sum: number; count: number }>();

      // ── Top 歌曲 ──
      const songStatsList: Array<{
        id: string; bvId: string; title: string; author: string;
        score: number; plays: number; likes: number; coins: number;
        favorites: number; shares: number; comments: number;
        publishTime: Date;
      }> = [];

      for (const song of allSongs) {
        const stats = parseStats(song.statistics);
        const plays = stats.playCount || 0;
        const likes = stats.likes || 0;
        const coins = stats.coins || 0;
        const favs = stats.favorites || 0;
        const shares = stats.shares || 0;
        const comments = stats.comments || 0;

        totalPlayCount += plays;
        totalLikeCount += likes;
        totalCoinCount += coins;
        totalFavCount += favs;
        totalShareCount += shares;
        totalCommentCount += comments;

        // 艺术家聚合
        const artist = song.author || '未知';
        const a = artistMap.get(artist) || { count: 0, totalPlays: 0, totalLikes: 0 };
        artistMap.set(artist, { count: a.count + 1, totalPlays: a.totalPlays + plays, totalLikes: a.totalLikes + likes });

        // 艺术家评分均值
        const as = artistScoreMap.get(artist) || { sum: 0, count: 0 };
        artistScoreMap.set(artist, { sum: as.sum + song.score, count: as.count + 1 });

        // 标签
        try {
          const tags: string[] = JSON.parse(song.tags);
          for (const tag of tags) {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          }
        } catch {}

        // 月份
        const monthKey = new Date(song.publishTime).toISOString().slice(0, 7);
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

        // 周
        const d = new Date(song.publishTime);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);

        // 评分分布
        const sc = song.score;
        if (sc < 20) scoreDist[0]++;
        else if (sc < 40) scoreDist[1]++;
        else if (sc < 60) scoreDist[2]++;
        else if (sc < 80) scoreDist[3]++;
        else scoreDist[4]++;

        // 歌曲详情（用于 top songs 表）
        songStatsList.push({
          id: song.id, bvId: song.bvId, title: song.title,
          author: song.author || '未知', score: song.score,
          plays, likes, coins, favorites: favs, shares, comments,
          publishTime: song.publishTime,
        });
      }

      // ── 排序输出 ──
      const topArtists = Array.from(artistMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalPlays - a.totalPlays)
        .slice(0, 15);

      const topTags = Array.from(tagMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const songsByMonth = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const songsByWeek = Array.from(weekMap.entries())
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => a.week.localeCompare(b.week));

      const topSongs = songStatsList
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      const mostPlayed = songStatsList
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10);

      // 平均分最高的 UP 主
      const topRatedArtists = Array.from(artistScoreMap.entries())
        .map(([name, data]) => ({ name, avgScore: Math.round((data.sum / data.count) * 10) / 10, count: data.count }))
        .filter((a) => a.count >= 2)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);

      const avgScore = allSongs.length > 0
        ? Math.round((allSongs.reduce((sum, s) => sum + s.score, 0) / allSongs.length) * 10) / 10
        : 0;

      return {
        overview: {
          totalSongs: allSongs.length,
          totalArtists: artistMap.size,
          totalPlayCount,
          totalLikeCount,
          totalCoinCount,
          totalFavCount,
          avgScore,
          avgPlaysPerSong: allSongs.length > 0 ? Math.round(totalPlayCount / allSongs.length) : 0,
          avgLikesPerSong: allSongs.length > 0 ? Math.round(totalLikeCount / allSongs.length) : 0,
        },
        engagement: {
          likePlayRatio: totalPlayCount > 0 ? ((totalLikeCount / totalPlayCount) * 100).toFixed(1) : '0',
          coinPlayRatio: totalPlayCount > 0 ? ((totalCoinCount / totalPlayCount) * 100).toFixed(1) : '0',
          favPlayRatio: totalPlayCount > 0 ? ((totalFavCount / totalPlayCount) * 100).toFixed(1) : '0',
          sharePlayRatio: totalPlayCount > 0 ? ((totalShareCount / totalPlayCount) * 100).toFixed(1) : '0',
          commentPlayRatio: totalPlayCount > 0 ? ((totalCommentCount / totalPlayCount) * 100).toFixed(1) : '0',
        },
        topTags,
        topArtists,
        topRatedArtists,
        topSongs,
        mostPlayed,
        songsByMonth,
        songsByWeek,
        scoreDistribution: scoreDist,
      };
    }),

  // 获取 AI 报告列表
  getReports: publicProcedure
    .input(
      z.object({
        type: z.enum(['daily_summary', 'trend_analysis', 'anomaly_detection']).optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { type, limit } = input;
      return ctx.prisma.aiReport.findMany({
        where: type ? { type } : {},
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }),
});
