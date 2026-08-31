/**
 * 站点聚合统计：只在采集/刷新后写入 Setting，读路径不再扫全表。
 */
import type { PrismaClient } from '@prisma/client';
import { chinaWeekRange } from '@/lib/time';
import { SETTING_KEYS, getSetting, setSetting } from './settings';
import { emptyAxes, meanAxes, parseSongStats, scoreBreakdown, type AxisVector } from './score/breakdown';

export async function recomputeSiteStats(prisma: PrismaClient): Promise<void> {
  const songs = await prisma.song.findMany({
    select: { statistics: true },
  });

  let totalPlays = 0;
  const breakdowns: AxisVector[] = [];
  for (const row of songs) {
    const stats = parseSongStats(row.statistics);
    totalPlays += stats.playCount;
    breakdowns.push(scoreBreakdown(stats));
  }

  const historical = meanAxes(breakdowns);
  await setSetting(prisma, SETTING_KEYS.totalPlays, String(totalPlays));
  await setSetting(prisma, SETTING_KEYS.totalSongs, String(songs.length));
  await setSetting(prisma, SETTING_KEYS.radarHistorical, JSON.stringify(historical));

  const week = chinaWeekRange();
  const weekRows = await prisma.songDailyStats.findMany({
    where: { date: { gte: week.snapDate, lt: week.end } },
    select: {
      playCount: true,
      likes: true,
      coins: true,
      favorites: true,
      shares: true,
      comments: true,
    },
  });
  const weekly = meanAxes(
    weekRows.map((r) =>
      scoreBreakdown({
        playCount: r.playCount,
        likes: r.likes,
        coins: r.coins,
        favorites: r.favorites,
        shares: r.shares,
        comments: r.comments,
      }),
    ),
  );
  await setSetting(prisma, SETTING_KEYS.radarWeekly, JSON.stringify(weekly));
}

function parseAxes(raw: string | null): AxisVector {
  if (!raw) return emptyAxes();
  try {
    const v = JSON.parse(raw) as AxisVector;
    return { ...emptyAxes(), ...v };
  } catch {
    return emptyAxes();
  }
}

export async function getSiteStats(prisma: PrismaClient): Promise<{
  totalPlays: number;
  totalSongs: number;
  radarHistorical: AxisVector;
  radarWeekly: AxisVector;
}> {
  const [plays, songs, hist, week] = await Promise.all([
    getSetting(prisma, SETTING_KEYS.totalPlays),
    getSetting(prisma, SETTING_KEYS.totalSongs),
    getSetting(prisma, SETTING_KEYS.radarHistorical),
    getSetting(prisma, SETTING_KEYS.radarWeekly),
  ]);
  return {
    totalPlays: Number(plays) || 0,
    totalSongs: Number(songs) || 0,
    radarHistorical: parseAxes(hist),
    radarWeekly: parseAxes(week),
  };
}
