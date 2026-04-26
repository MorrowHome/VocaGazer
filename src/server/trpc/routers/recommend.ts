/**
 * 推荐系统 tRPC 路由
 */
import { router, publicProcedure } from '../trpc';

function parseStats(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

export const recommendRouter = router({
  // 获取推荐页全量数据
  getRecommendations: publicProcedure.query(async ({ ctx }) => {
    const [editorPicks, hotPicks, recentPicks] = await Promise.all([
      // 编辑推荐：评分最高的 12 首
      ctx.prisma.song.findMany({
        orderBy: { score: 'desc' },
        take: 12,
      }),
      // 热门推荐：播放量最高的 12 首
      ctx.prisma.song.findMany({
        orderBy: { score: 'desc' },
        take: 50,
      }),
      // 最新发布
      ctx.prisma.song.findMany({
        orderBy: { publishTime: 'desc' },
        take: 12,
      }),
    ]);

    // 从高分池中按播放量排序取 hot picks
    const hotWithPlays = hotPicks
      .map((s) => ({ ...s, _playCount: parseStats(s.statistics).playCount || 0 }))
      .sort((a, b) => b._playCount - a._playCount)
      .slice(0, 12);

    // 去除 hotPicks 里的 _playCount 临时字段
    const hotSongs = hotWithPlays.map(({ _playCount, ...rest }) => rest);

    return {
      editorPicks,
      hotSongs,
      recentPicks,
    };
  }),
});
