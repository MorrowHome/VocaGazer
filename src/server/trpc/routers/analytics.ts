/**
 * 数据分析 tRPC 路由
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { chinaCalendarDay, shiftChinaDays } from '@/lib/time';
import { HOMEPAGE_CACHE_TTL_MS, cacheGet, cacheSet } from '../../cache/memory';
import { getSiteStats } from '@/server/services/site-stats';
import { SETTING_KEYS, getSetting } from '@/server/services/settings';
import { BASELINE_FLAT, hasAxisValues, logProfile, normalizeRadar, parseSongStats, type AxisVector } from '@/server/services/score/breakdown';
import { recomputeSiteStats } from '@/server/services/site-stats';

function parseStats(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

const rangeSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');

function getDateRange(range: string): Date | null {
  if (range === 'all') return null;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function rankingSongs(prisma: any, period: 'daily' | 'weekly', take: number) {
  const snap = await prisma.ranking.findFirst({
    where: { period, isFinal: false },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  const date = snap?.date
    ?? (await prisma.ranking.findFirst({
      where: { period },
      orderBy: { date: 'desc' },
      select: { date: true },
    }))?.date;
  if (!date) return [];
  const entries = await prisma.ranking.findMany({
    where: { period, date },
    orderBy: { rank: 'asc' },
    take,
    include: { song: true },
  });
  return entries.map((e: { song: unknown }) => e.song).filter(Boolean);
}

async function findRisingSong(prisma: any) {
  const today = chinaCalendarDay();
  const yesterday = chinaCalendarDay(shiftChinaDays(new Date(), -1));
  const [todayRows, ydayRows] = await Promise.all([
    prisma.songDailyStats.findMany({
      where: { date: today.snapDate },
      select: { songId: true, score: true },
    }),
    prisma.songDailyStats.findMany({
      where: { date: yesterday.snapDate },
      select: { songId: true, score: true },
    }),
  ]);
  const yMap = new Map<string, number>(
    (ydayRows as Array<{ songId: string; score: number }>).map((r) => [r.songId, r.score]),
  );
  let best: { songId: string; delta: number } | null = null;
  for (const row of todayRows as Array<{ songId: string; score: number }>) {
    const prev = yMap.get(row.songId);
    if (prev == null) continue;
    const delta = row.score - prev;
    if (!best || delta > best.delta) best = { songId: row.songId, delta };
  }
  if (!best || best.delta <= 0) return null;
  const song = await prisma.song.findUnique({ where: { id: best.songId } });
  return song ? { ...song, scoreDelta: best.delta } : null;
}

export const analyticsRouter = router({
  getHomepage: publicProcedure.query(async ({ ctx }) => {
    const cached = cacheGet<{
      stats: { totalSongs: number; todaySongs: number; totalPlayCount: number; weekSongs: number };
      latestSong: any;
      weeklyHotSong: any;
      dailyHotSong: any;
      risingSong: any;
      heroImageUrl: string | null;
      latestSongs: any[];
      dailyRanking: any[];
      weeklyRanking: any[];
    }>('homepage:v1');
    if (cached) return cached;

    const { start: todayStart } = chinaCalendarDay();
    const weekStart = chinaCalendarDay(shiftChinaDays(new Date(), -7)).start;
    const site = await getSiteStats(ctx.prisma);

    const [todaySongs, weekSongs, latestSongs, dailyRanking, weeklyRanking, risingSong, heroOverride] =
      await Promise.all([
        ctx.prisma.song.count({ where: { publishTime: { gte: todayStart } } }),
        ctx.prisma.song.count({ where: { publishTime: { gte: weekStart } } }),
        ctx.prisma.song.findMany({ orderBy: { publishTime: 'desc' }, take: 20 }),
        rankingSongs(ctx.prisma, 'daily', 10),
        rankingSongs(ctx.prisma, 'weekly', 10),
        findRisingSong(ctx.prisma),
        getSetting(ctx.prisma, SETTING_KEYS.heroImageUrl),
      ]);

    const latestSong = latestSongs[0] ?? null;
    const weeklyHotSong = weeklyRanking[0] ?? null;
    const dailyHotSong = dailyRanking[0] ?? null;

    const payload = {
      stats: {
        totalSongs: site.totalSongs,
        todaySongs,
        totalPlayCount: site.totalPlays,
        weekSongs,
      },
      latestSong,
      weeklyHotSong,
      dailyHotSong,
      risingSong,
      heroImageUrl: heroOverride || weeklyHotSong?.picUrl || dailyHotSong?.picUrl || null,
      latestSongs,
      dailyRanking,
      weeklyRanking,
    };
    cacheSet('homepage:v1', payload, HOMEPAGE_CACHE_TTL_MS);
    return payload;
  }),

  getRadar: publicProcedure
    .input(
      z.object({
        bvId: z.string(),
        baseline: z.enum(['weekly', 'historical']).default('weekly'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const song = await ctx.prisma.song.findUnique({
        where: { bvId: input.bvId },
        select: { statistics: true, score: true, dailyStats: { orderBy: { date: 'desc' }, take: 1 } },
      });
      if (!song) throw new Error('歌曲未找到');

      const raw = parseSongStats(song.statistics);
      let site = await getSiteStats(ctx.prisma);
      if (!hasAxisValues(site.radarHistorical) && !hasAxisValues(site.radarWeekly)) {
        await recomputeSiteStats(ctx.prisma);
        site = await getSiteStats(ctx.prisma);
      }

      const weekly = site.radarWeekly;
      const historical = site.radarHistorical;
      const baselineRaw: AxisVector =
        input.baseline === 'weekly' && hasAxisValues(weekly)
          ? weekly
          : hasAxisValues(historical)
            ? historical
            : hasAxisValues(weekly)
              ? weekly
              : raw;

      const hasCatalog = hasAxisValues(baselineRaw) && baselineRaw !== raw;
      const normalized = hasCatalog ? normalizeRadar(raw, baselineRaw) : logProfile(raw);

      return {
        score: song.score,
        raw,
        baselineRaw: hasCatalog ? baselineRaw : null,
        normalized,
        baseline: hasCatalog ? BASELINE_FLAT : null,
        baselineKind: input.baseline,
        latestSnapshotDate: song.dailyStats[0]?.date ?? null,
      };
    }),

  getAnalytics: publicProcedure
    .input(z.object({ range: rangeSchema }))
    .query(async ({ ctx, input }) => {
      const { range } = input;
      const dateFilter = getDateRange(range);
      const where = dateFilter ? { publishTime: { gte: dateFilter } } : {};

      const allSongs = await ctx.prisma.song.findMany({
        where,
        orderBy: { publishTime: 'desc' },
        select: {
          id: true,
          bvId: true,
          title: true,
          author: true,
          score: true,
          statistics: true,
          tags: true,
          publishTime: true,
        },
      });

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

        const artist = song.author || '未知';
        const a = artistMap.get(artist) || { count: 0, totalPlays: 0, totalLikes: 0 };
        artistMap.set(artist, { count: a.count + 1, totalPlays: a.totalPlays + plays, totalLikes: a.totalLikes + likes });

        const as = artistScoreMap.get(artist) || { sum: 0, count: 0 };
        artistScoreMap.set(artist, { sum: as.sum + song.score, count: as.count + 1 });

        const title = song.title || '';
        let tags: string[] = [];
        try {
          const parsed = JSON.parse(song.tags);
          if (Array.isArray(parsed)) tags = parsed;
        } catch { /* ignore */ }
        const HINTS = [
          '初音', '镜音', '巡音', 'MEIKO', 'KAITO', '洛天依', '言和', '乐正',
          '星尘', 'GUMI', 'flower', '重音テト', '音街', 'VOCALOID', '术力口', '诗岸', '海伊',
        ];
        for (const h of HINTS) {
          if (title.includes(h) && !tags.some((t) => t.includes(h))) tags.push(h);
        }
        for (const tag of tags) {
          if (!tag) continue;
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        }

        const monthKey = new Date(song.publishTime).toISOString().slice(0, 7);
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

        const d = new Date(song.publishTime);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        weekMap.set(weekStart.toISOString().slice(0, 10), (weekMap.get(weekStart.toISOString().slice(0, 10)) || 0) + 1);

        const sc = song.score;
        if (sc < 20) scoreDist[0]++;
        else if (sc < 40) scoreDist[1]++;
        else if (sc < 60) scoreDist[2]++;
        else if (sc < 80) scoreDist[3]++;
        else scoreDist[4]++;

        songStatsList.push({
          id: song.id, bvId: song.bvId, title: song.title,
          author: song.author || '未知', score: song.score,
          plays, likes, coins, favorites: favs, shares, comments,
          publishTime: song.publishTime,
        });
      }

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

      const topSongs = [...songStatsList].sort((a, b) => b.score - a.score).slice(0, 20);
      const mostPlayed = [...songStatsList].sort((a, b) => b.plays - a.plays).slice(0, 10);

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
