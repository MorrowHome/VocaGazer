/**
 * 数据分析 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

function parseStats(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

export const analyticsRouter = router({
  // 获取首页全量数据
  getHomepage: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalSongs, todaySongs, weekSongs, latestSongs, dailyRanking, weeklyRanking, topSongs] =
      await Promise.all([
        ctx.prisma.song.count(),
        ctx.prisma.song.count({ where: { publishTime: { gte: todayStart } } }),
        ctx.prisma.song.count({ where: { publishTime: { gte: weekAgo } } }),
        ctx.prisma.song.findMany({ orderBy: { publishTime: 'desc' }, take: 20 }),
        ctx.prisma.song.findMany({
          where: { publishTime: { gte: todayStart } },
          orderBy: { score: 'desc' },
          take: 10,
        }),
        ctx.prisma.song.findMany({
          where: { publishTime: { gte: weekAgo } },
          orderBy: { score: 'desc' },
          take: 10,
        }),
        ctx.prisma.song.findMany({ orderBy: { score: 'desc' }, take: 10 }),
      ]);

    const latestSong = latestSongs.length > 0 ? latestSongs[0] : null;
    const weeklyHotSong = weeklyRanking.length > 0 ? weeklyRanking[0] : null;

    let totalPlayCount = 0;
    for (const song of latestSongs) {
      try {
        const s = JSON.parse(song.statistics);
        totalPlayCount += s.playCount || 0;
      } catch {}
    }

    return {
      stats: { totalSongs, todaySongs, totalPlayCount, weekSongs },
      latestSong,
      weeklyHotSong,
      latestSongs,
      dailyRanking,
      weeklyRanking,
      topSongs,
    };
  }),

  // 获取数据分析页全量数据
  getAnalytics: publicProcedure.query(async ({ ctx }) => {
    const allSongs = await ctx.prisma.song.findMany({
      orderBy: { publishTime: 'desc' },
    });

    // 聚合计算
    const artistMap = new Map<string, { count: number; totalPlays: number }>();
    const tagMap = new Map<string, number>();
    let totalPlayCount = 0;
    let totalLikeCount = 0;

    // 按月分组
    const monthMap = new Map<string, number>();
    // 评分分布
    const scoreDist = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100

    for (const song of allSongs) {
      const stats = parseStats(song.statistics);
      const plays = stats.playCount || 0;
      totalPlayCount += plays;
      totalLikeCount += stats.likes || 0;

      // 艺术家
      const artist = song.author || '未知';
      const existing = artistMap.get(artist) || { count: 0, totalPlays: 0 };
      artistMap.set(artist, { count: existing.count + 1, totalPlays: existing.totalPlays + plays });

      // 标签
      try {
        const tags: string[] = JSON.parse(song.tags);
        for (const tag of tags) {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        }
      } catch {}

      // 按月
      const monthKey = new Date(song.publishTime).toISOString().slice(0, 7); // "2024-01"
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

      // 评分分布
      const score = song.score;
      if (score < 20) scoreDist[0]++;
      else if (score < 40) scoreDist[1]++;
      else if (score < 60) scoreDist[2]++;
      else if (score < 80) scoreDist[3]++;
      else scoreDist[4]++;
    }

    // 排序
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

    const avgScore = allSongs.length > 0
      ? allSongs.reduce((sum, s) => sum + s.score, 0) / allSongs.length
      : 0;

    return {
      overview: {
        totalSongs: allSongs.length,
        totalArtists: artistMap.size,
        totalPlayCount,
        totalLikeCount,
        avgScore: Math.round(avgScore * 10) / 10,
      },
      topTags,
      topArtists,
      songsByMonth,
      scoreDistribution: scoreDist,
    };
  }),

  // 获取 AI 报告列表
  getReports: publicProcedure
    .input(
      z.object({
        type: z
          .enum(['daily_summary', 'trend_analysis', 'anomaly_detection'])
          .optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { type, limit } = input;
      const reports = await ctx.prisma.aiReport.findMany({
        where: type ? { type } : {},
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return reports;
    }),
});
