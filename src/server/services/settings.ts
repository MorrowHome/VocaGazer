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
  radarWeekly: 'stats_radar_weekly_v2',
  refreshCursor: 'refresh_cursor',
  refreshDay: 'refresh_day',
  heroImageUrl: 'hero_image_url',
  defaultBgUrl: 'default_bg_url',
} as const;
