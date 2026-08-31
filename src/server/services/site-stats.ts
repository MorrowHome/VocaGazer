/**
 * 站点聚合统计：只在采集/刷新后写入 Setting，读路径不再扫全表。
 */
import type { PrismaClient } from '@prisma/client';
import { chinaWeekRange, shiftChinaDays } from '@/lib/time';
import { SETTING_KEYS, getSetting, setSetting } from './settings';
import {
  emptyAxes,
  emptyRates,
  meanAxes,
  meanRatesFromAxes,
  parseSongStats,
  toAxisVector,
  axisDelta,
  hasAxisValues,
  type AxisVector,
  type RateVector,
} from './score/breakdown';

export async function recomputeSiteStats(prisma: PrismaClient): Promise<void> {
  const songs = await prisma.song.findMany({
    select: { statistics: true },
  });

  let totalPlays = 0;
  const raws: AxisVector[] = [];
  for (const row of songs) {
    const stats = parseSongStats(row.statistics);
    totalPlays += stats.playCount;
    raws.push(stats);
  }

  const historical = meanAxes(raws);
  await setSetting(prisma, SETTING_KEYS.totalPlays, String(totalPlays));
  await setSetting(prisma, SETTING_KEYS.totalSongs, String(songs.length));
  await setSetting(prisma, SETTING_KEYS.radarHistorical, JSON.stringify(historical));

  const week = chinaWeekRange();
  const lookback = shiftChinaDays(week.snapDate, -14);
  const weekRows = await prisma.songDailyStats.findMany({
    where: { date: { gte: lookback, lt: week.end } },
    select: {
      songId: true,
      date: true,
      playCount: true,
      likes: true,
      coins: true,
      favorites: true,
      shares: true,
      comments: true,
    },
    orderBy: { date: 'asc' },
  });
  const weekly = meanWeeklyDeltas(weekRows, week.snapDate);
  const historicalRates = meanRatesFromAxes(raws);
  const weeklyRates = meanWeeklyRates(weekRows, week.snapDate);
  await setSetting(prisma, SETTING_KEYS.radarWeekly, JSON.stringify(weekly));
  await setSetting(prisma, SETTING_KEYS.radarHistoricalRates, JSON.stringify(historicalRates));
  await setSetting(prisma, SETTING_KEYS.radarWeeklyRates, JSON.stringify(weeklyRates));
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

function parseRates(raw: string | null): RateVector {
  if (!raw) return emptyRates();
  try {
    const v = JSON.parse(raw) as RateVector;
    return { ...emptyRates(), ...v };
  } catch {
    return emptyRates();
  }
}

export async function getSiteStats(prisma: PrismaClient): Promise<{
  totalPlays: number;
  totalSongs: number;
  radarHistorical: AxisVector;
  radarWeekly: AxisVector;
  radarHistoricalRates: RateVector;
  radarWeeklyRates: RateVector;
}> {
  const [plays, songs, hist, week, histRates, weekRates] = await Promise.all([
    getSetting(prisma, SETTING_KEYS.totalPlays),
    getSetting(prisma, SETTING_KEYS.totalSongs),
    getSetting(prisma, SETTING_KEYS.radarHistorical),
    getSetting(prisma, SETTING_KEYS.radarWeekly),
    getSetting(prisma, SETTING_KEYS.radarHistoricalRates),
    getSetting(prisma, SETTING_KEYS.radarWeeklyRates),
  ]);
  return {
    totalPlays: Number(plays) || 0,
    totalSongs: Number(songs) || 0,
    radarHistorical: parseAxes(hist),
    radarWeekly: parseAxes(week),
    radarHistoricalRates: parseRates(histRates),
    radarWeeklyRates: parseRates(weekRates),
  };
}

type SnapRow = {
  songId: string;
  date: Date;
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
};

function groupSnaps(rows: SnapRow[]): Map<string, SnapRow[]> {
  const bySong = new Map<string, SnapRow[]>();
  for (const row of rows) {
    const list = bySong.get(row.songId) || [];
    list.push(row);
    bySong.set(row.songId, list);
  }
  return bySong;
}

function meanWeeklyDeltas(rows: SnapRow[], weekStart: Date): AxisVector {
  const deltas: AxisVector[] = [];
  const startMs = weekStart.getTime();
  for (const snaps of Array.from(groupSnaps(rows).values())) {
    const delta = weekDeltaFromSnaps(snaps, startMs);
    if (delta && hasAxisValues(delta)) deltas.push(delta);
  }
  return deltas.length ? meanAxes(deltas) : emptyAxes();
}

function meanWeeklyRates(rows: SnapRow[], weekStart: Date): RateVector {
  const deltas: AxisVector[] = [];
  const startMs = weekStart.getTime();
  for (const snaps of Array.from(groupSnaps(rows).values())) {
    const delta = weekDeltaFromSnaps(snaps, startMs);
    if (delta) deltas.push(delta);
  }
  return meanRatesFromAxes(deltas);
}

function weekDeltaFromSnaps(snaps: SnapRow[], weekStartMs: number): AxisVector | null {
  const before = [...snaps].reverse().find((s) => s.date.getTime() < weekStartMs);
  const inWeek = snaps.filter((s) => s.date.getTime() >= weekStartMs);
  if (inWeek.length === 0) return null;
  const last = inWeek[inWeek.length - 1];
  const prev = before ?? (inWeek.length > 1 ? inWeek[0] : null);
  return axisDelta(toAxisVector(last), prev ? toAxisVector(prev) : null);
}

export function songWeekDelta(
  snaps: Array<{
    date: Date;
    playCount: number;
    likes: number;
    coins: number;
    favorites: number;
    shares: number;
    comments: number;
  }>,
  weekStart: Date,
): AxisVector | null {
  return weekDeltaFromSnaps(
    snaps.map((s) => ({ ...s, songId: '_' })),
    weekStart.getTime(),
  );
}
