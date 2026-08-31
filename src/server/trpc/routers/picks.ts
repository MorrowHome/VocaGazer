import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';
import { cacheInvalidate } from '../../cache/memory';

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

  setHeroImage: adminProcedure
    .input(z.object({ url: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.setting.upsert({
        where: { key: 'hero_image_url' },
        update: { value: input.url },
        create: { key: 'hero_image_url', value: input.url },
      });
      cacheInvalidate('homepage:');
      return { ok: true };
    }),
});
