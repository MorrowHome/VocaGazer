import type { PrismaClient } from '@prisma/client';

export async function getSetting(prisma: PrismaClient, key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(prisma: PrismaClient, key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export const SETTING_KEYS = {
  totalPlays: 'stats_total_plays',
  totalSongs: 'stats_total_songs',
  radarHistorical: 'stats_radar_historical_v2',
  radarWeekly: 'stats_radar_weekly_v3',
  radarHistoricalRates: 'stats_radar_historical_rates_v1',
  radarWeeklyRates: 'stats_radar_weekly_rates_v1',
  refreshCursor: 'refresh_cursor',
  refreshDay: 'refresh_day',
  heroImageUrl: 'hero_image_url',
  heroSongBvId: 'hero_song_bv_id',
  defaultBgUrl: 'default_bg_url',
  crawlJob: 'crawl_job',
  aiApiKey: 'ai_api_key',
  aiBaseUrl: 'ai_base_url',
  aiModel: 'ai_model',
  ingestBlocklist: 'ingest_blocklist',
} as const;

export async function getIngestBlocklist(prisma: PrismaClient): Promise<string[]> {
  const raw = await getSetting(prisma, SETTING_KEYS.ingestBlocklist);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((id) => String(id)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function addIngestBlock(prisma: PrismaClient, bvId: string): Promise<void> {
  const list = await getIngestBlocklist(prisma);
  if (list.includes(bvId)) return;
  list.push(bvId);
  await setSetting(prisma, SETTING_KEYS.ingestBlocklist, JSON.stringify(list));
}

export async function removeIngestBlock(prisma: PrismaClient, bvId: string): Promise<void> {
  const next = (await getIngestBlocklist(prisma)).filter((id) => id !== bvId);
  await setSetting(prisma, SETTING_KEYS.ingestBlocklist, JSON.stringify(next));
}
