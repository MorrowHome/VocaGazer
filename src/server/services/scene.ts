import type { PrismaClient } from '@prisma/client';
import { BUNDLED_DEFAULT_BG } from '@/lib/scene';
import { normalizePicUrl } from '@/lib/utils';
import { SETTING_KEYS, getSetting } from './settings';

export type SceneInfo = {
  overrideUrl: string | null;
  weeklyUrl: string | null;
  weeklyTitle: string | null;
  weeklyBvId: string | null;
  defaultUrl: string;
  activeUrl: string;
};

async function weeklyTopCover(prisma: PrismaClient) {
  const snap = await prisma.ranking.findFirst({
    where: { period: 'weekly', isFinal: false },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  const date =
    snap?.date ??
    (
      await prisma.ranking.findFirst({
        where: { period: 'weekly' },
        orderBy: { date: 'desc' },
        select: { date: true },
      })
    )?.date;
  if (!date) return null;
  const entry = await prisma.ranking.findFirst({
    where: { period: 'weekly', date, rank: 1 },
    include: { song: { select: { picUrl: true, title: true, bvId: true } } },
  });
  const song = entry?.song;
  if (!song) return null;
  return {
    picUrl: normalizePicUrl(song.picUrl),
    title: song.title,
    bvId: song.bvId,
  };
}

export async function getSceneInfo(prisma: PrismaClient): Promise<SceneInfo> {
  const [overrideRaw, defaultRaw, weekly] = await Promise.all([
    getSetting(prisma, SETTING_KEYS.heroImageUrl),
    getSetting(prisma, SETTING_KEYS.defaultBgUrl),
    weeklyTopCover(prisma),
  ]);
  const overrideUrl = normalizePicUrl(overrideRaw?.trim() || null);
  const defaultUrl = normalizePicUrl(defaultRaw?.trim() || null) || BUNDLED_DEFAULT_BG;
  const weeklyUrl = weekly?.picUrl ?? null;
  return {
    overrideUrl,
    weeklyUrl,
    weeklyTitle: weekly?.title ?? null,
    weeklyBvId: weekly?.bvId ?? null,
    defaultUrl,
    activeUrl: overrideUrl || weeklyUrl || defaultUrl,
  };
}

export function parseBgUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('..')) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('无效的图片地址');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('只用 http(s) 图片地址');
  }
  return parsed.toString().replace(/^http:\/\//, 'https://');
}
