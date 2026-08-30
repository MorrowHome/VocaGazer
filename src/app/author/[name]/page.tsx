'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo } from '@/lib/utils';

export default function AuthorPage() {
  const { name } = useParams<{ name: string }>();
  const author = decodeURIComponent(name);
  const { data, isLoading } = trpc.songs.getByAuthor.useQuery({ author });

  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          {data?.songs[0]?.authorAvatar ? (
            <img src={data.songs[0].authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-kawaii-border/30" />
          ) : (
            <span className="text-kawaii-cyan text-xl" aria-hidden="true">♫</span>
          )}
          <div>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">{author}</h1>
            {data && (
              <p className="text-xs text-kawaii-muted font-bold">{data.total} 首歌曲</p>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : !data?.songs.length ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3 text-kawaii-muted" aria-hidden="true">♪</p>
            <p className="text-sm text-kawaii-muted font-medium">该作者暂无歌曲数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.songs.map((song: any) => {
              const stats = parseStats(song.statistics);
              return (
                <a
                  key={song.id}
                  href={`/song/${song.bvId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center gap-4 p-4 hover:border-kawaii-cyan/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-kawaii-surface ring-1 ring-kawaii-border/30">
                    {song.picUrl ? (
                      <img src={song.picUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-kawaii-muted">♪</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-cyan transition-colors">
                      {song.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-kawaii-muted font-medium">
                      <span>{formatCount(stats.playCount ?? 0)} 播放</span>
                      <span>·</span>
                      <span>{timeAgo(song.publishTime)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-kawaii-cyan">{song.score.toFixed(1)}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
