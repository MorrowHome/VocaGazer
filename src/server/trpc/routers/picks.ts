import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { cacheInvalidate } from '../../cache/memory';
import { getSceneInfo, parseBgUrl } from '@/server/services/scene';
import { SETTING_KEYS, setSetting } from '@/server/services/settings';

async function findLibrarySong(prisma: { song: { findUnique: Function; findFirst: Function } }, q: string) {
  const raw = q.trim();
  const bv = raw.match(/BV[0-9A-Za-z]+/i)?.[0];
  if (bv) {
    const byId = await prisma.song.findUnique({
      where: { bvId: bv },
      select: { bvId: true, title: true, picUrl: true },
    });
    if (byId) return byId;
  }
  return prisma.song.findFirst({
    where: {
      OR: [{ bvId: raw }, { title: { contains: raw } }],
    },
    orderBy: { score: 'desc' },
    select: { bvId: true, title: true, picUrl: true },
  });
}

export const picksRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.editorPick.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { song: true },
    });
  }),

  add: adminProcedure
    .input(
      z.object({
        bvId: z.string().min(3),
        note: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const song = await ctx.prisma.song.findUnique({ where: { bvId: input.bvId } });
      if (!song) {
        const byTitle = await ctx.prisma.song.findFirst({
          where: { title: { contains: input.bvId } },
        });
        if (!byTitle) throw new Error('找不到这首歌，请用 BV 号或完整标题');
        const max = await ctx.prisma.editorPick.aggregate({ _max: { sortOrder: true } });
        const pick = await ctx.prisma.editorPick.upsert({
          where: { songId: byTitle.id },
          update: { note: input.note ?? '' },
          create: {
            songId: byTitle.id,
            note: input.note ?? '',
            sortOrder: (max._max.sortOrder ?? 0) + 1,
          },
          include: { song: true },
        });
        cacheInvalidate('recommend:');
        return pick;
      }
      const max = await ctx.prisma.editorPick.aggregate({ _max: { sortOrder: true } });
      const pick = await ctx.prisma.editorPick.upsert({
        where: { songId: song.id },
        update: { note: input.note ?? '' },
        create: {
          songId: song.id,
          note: input.note ?? '',
          sortOrder: (max._max.sortOrder ?? 0) + 1,
        },
        include: { song: true },
      });
      cacheInvalidate('recommend:');
      return pick;
    }),

  remove: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await ctx.prisma.editorPick.delete({ where: { id: input } });
    cacheInvalidate('recommend:');
    return { ok: true };
  }),

  reorder: adminProcedure
    .input(z.object({ id: z.string(), sortOrder: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.editorPick.update({
        where: { id: input.id },
        data: { sortOrder: input.sortOrder },
      });
      cacheInvalidate('recommend:');
      return { ok: true };
    }),

  scene: publicProcedure.query(async ({ ctx }) => {
    return getSceneInfo(ctx.prisma);
  }),

  setHeroScene: adminProcedure
    .input(
      z.discriminatedUnion('mode', [
        z.object({ mode: z.literal('weekly') }),
        z.object({ mode: z.literal('song'), q: z.string().min(2).max(120) }),
        z.object({ mode: z.literal('url'), url: z.string().min(1).max(500) }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.mode === 'weekly') {
        await setSetting(ctx.prisma, SETTING_KEYS.heroImageUrl, '');
        await setSetting(ctx.prisma, SETTING_KEYS.heroSongBvId, '');
      } else if (input.mode === 'song') {
        const song = await findLibrarySong(ctx.prisma, input.q);
        if (!song) throw new Error('库里找不到这首歌，试试 BV 号或更完整的标题');
        await setSetting(ctx.prisma, SETTING_KEYS.heroSongBvId, song.bvId);
        await setSetting(ctx.prisma, SETTING_KEYS.heroImageUrl, '');
      } else {
        const url = parseBgUrl(input.url);
        if (!url) throw new Error('请填写图片地址');
        await setSetting(ctx.prisma, SETTING_KEYS.heroImageUrl, url);
        await setSetting(ctx.prisma, SETTING_KEYS.heroSongBvId, '');
      }
      cacheInvalidate('homepage:');
      return getSceneInfo(ctx.prisma);
    }),

  setHeroImage: adminProcedure
    .input(z.object({ url: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const url = parseBgUrl(input.url);
      await setSetting(ctx.prisma, SETTING_KEYS.heroImageUrl, url);
      await setSetting(ctx.prisma, SETTING_KEYS.heroSongBvId, '');
      cacheInvalidate('homepage:');
      return { ok: true };
    }),

  setDefaultBg: adminProcedure
    .input(z.object({ url: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const url = parseBgUrl(input.url);
      await ctx.prisma.setting.upsert({
        where: { key: 'default_bg_url' },
        update: { value: url },
        create: { key: 'default_bg_url', value: url },
      });
      cacheInvalidate('homepage:');
      return { ok: true };
    }),
});
