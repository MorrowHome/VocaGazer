import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://morrowhome.site').replace(/\/$/, '');

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '',
    '/ranking',
    '/recommend',
    '/search',
    '/tags',
    '/authors',
    '/milestones',
    '/analytics',
    '/forum',
    '/about',
  ];

  const [songs, authors, posts] = await Promise.all([
    prisma.song.findMany({
      select: { bvId: true, updatedAt: true },
      orderBy: { score: 'desc' },
      take: 3000,
    }),
    prisma.song.findMany({
      distinct: ['author'],
      select: { author: true, updatedAt: true },
      orderBy: { score: 'desc' },
      take: 400,
    }),
    prisma.post.findMany({
      where: { isDeleted: false },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  return [
    ...staticPaths.map((path) => ({
      url: `${BASE}${path || '/'}`,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.6,
    })),
    ...songs.map((s) => ({
      url: `${BASE}/song/${encodeURIComponent(s.bvId)}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...authors.map((a) => ({
      url: `${BASE}/author/${encodeURIComponent(a.author)}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/forum/post/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}
