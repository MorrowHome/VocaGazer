'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { SongStatsDashboard } from '@/components/SongStatsDashboard';

export default function SongStatsPage() {
  const { bvId } = useParams<{ bvId: string }>();
  const id = decodeURIComponent(bvId);
  const { data: song, isLoading, error } = trpc.songs.getByBvId.useQuery(id);

  if (isLoading) {
    return (
      <main className="min-h-screen relative">
        <div className="site-shell py-8 space-y-4 relative z-10">
          <div className="h-16 w-2/3 rounded-xl bg-kawaii-surface/50 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="min-h-screen relative">
        <div className="site-shell py-8 relative z-10">
          <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink font-medium">&larr; 返回</a>
          <p className="text-kawaii-muted font-medium mt-8">歌曲未找到</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <div className="site-shell py-8 space-y-6 relative z-10">
        <a href={`/song/${song.bvId}`} className="text-sm text-kawaii-muted hover:text-kawaii-pink font-medium">
          &larr; 返回歌曲
        </a>
        <SongStatsDashboard
          bvId={song.bvId}
          title={song.title}
          author={song.author}
          picUrl={song.picUrl}
          score={song.score}
          statistics={song.statistics}
        />
      </div>
    </main>
  );
}
