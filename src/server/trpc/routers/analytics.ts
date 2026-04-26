/**
 * 数据分析 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const analyticsRouter = router({
  // 获取首页全量数据（概览 + 排行榜 + 最新发布）
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
        // 日榜：今日发布的歌曲按评分排序
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

    // 计算总播放量
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
