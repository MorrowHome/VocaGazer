'use client';

import type { MouseEvent } from 'react';
import { useAuth } from '@/components/AuthContext';
import { trpc } from '@/lib/trpc';

export function AdminDeleteSongButton({
  bvId,
  title,
  variant = 'chip',
  className,
  onDeleted,
}: {
  bvId: string;
  title?: string;
  variant?: 'chip' | 'overlay' | 'row';
  className?: string;
  onDeleted?: () => void;
}) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const remove = trpc.songs.remove.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.analytics.getHomepage.invalidate(),
        utils.recommend.getRecommendations.invalidate(),
        utils.songs.search.invalidate(),
        utils.songs.getLatest.invalidate(),
        utils.rankings.get.invalidate(),
      ]);
      onDeleted?.();
    },
  });

  if (user?.role !== 'admin') return null;

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const label = title || bvId;
    if (!window.confirm(`从站点删除「${label}」？排行和收藏会一起去掉，之后采集也不会再收进来。`)) return;
    remove.mutate({ bvId });
  };

  const label = remove.isLoading ? '删除中…' : '删除';
  const cls =
    variant === 'overlay'
      ? 'absolute top-2 right-2 z-20 text-[10px] font-bold px-2 py-1 rounded-full bg-kawaii-hero-void/85 text-kawaii-pink ring-1 ring-kawaii-pink/40 hover:bg-kawaii-pink hover:text-white shadow-sm'
      : variant === 'row'
        ? 'text-xs font-bold text-kawaii-pink hover:underline shrink-0'
        : 'btn btn-ghost inline-flex items-center gap-2 !text-kawaii-pink md:!bg-white/15 md:!text-kawaii-pink-light md:!border-kawaii-pink/40';

  return (
    <button type="button" className={`${cls} ${className ?? ''}`} disabled={remove.isLoading} onClick={onClick}>
      {label}
    </button>
  );
}
