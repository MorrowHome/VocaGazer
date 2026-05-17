'use client';

import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

export default function AuthorsPage() {
  const { data, isLoading } = trpc.songs.getAuthors.useQuery({ limit: 200 });

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回</a>
            <span aria-hidden="true" className="text-kawaii-cyan">♫</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">创作者</h1>
          </div>
          {data && (
            <span className="text-xs text-kawaii-muted font-bold">{data.length} 位</span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data?.map((a) => (
              <a
                key={a.author}
                href={`/author/${encodeURIComponent(a.author)}`}
                className="card flex items-center gap-4 p-4 hover:border-kawaii-cyan/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-kawaii-cyan/20 to-kawaii-pink/20 ring-1 ring-kawaii-border/30">
                  {(a as any).avatar ? (
                    <img src={(a as any).avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-lg text-kawaii-cyan" aria-hidden="true">♫</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-kawaii-text truncate group-hover:text-kawaii-cyan transition-colors">
                    {a.author}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-kawaii-cyan">{a.count}</p>
                  <p className="text-[10px] text-kawaii-muted font-medium">首歌曲</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
