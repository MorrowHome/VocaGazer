'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = trpc.songs.search.useQuery(
    { q: searchTerm, limit: 50 },
    { enabled: searchTerm.length > 0 },
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回</a>
            <span aria-hidden="true" className="text-kawaii-pink">♩</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">搜索</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索歌曲标题或作者…"
              className="flex-1 px-5 py-3 rounded-2xl bg-white/80 border border-kawaii-border/50 outline-none text-sm text-kawaii-text font-medium placeholder:text-kawaii-muted/50 focus:border-kawaii-pink/40 focus:shadow-lg focus:shadow-kawaii-pink/5 transition-all"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-pink !py-3 !px-6 rounded-2xl text-sm"
            >
              搜索
            </button>
          </div>
        </form>

        {searchTerm && isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        )}

        {searchTerm && data && (
          <>
            <p className="text-xs text-kawaii-muted font-medium mb-4">
              找到 {data.total} 首歌曲
            </p>
            {data.songs.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3 text-kawaii-muted" aria-hidden="true">♪</p>
                <p className="text-sm text-kawaii-muted font-medium">未找到相关歌曲</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.songs.map((song: any) => {
                  const stats = parseStats(song.statistics);
                  return (
                    <a
                      key={song.id}
                      href={`/song/${song.bvId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card flex items-center gap-4 p-4 hover:border-kawaii-pink/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-kawaii-surface ring-1 ring-kawaii-border/30">
                        {song.picUrl ? (
                          <img src={song.picUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-kawaii-muted">♪</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">
                          {song.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-kawaii-muted font-medium">
                          <span className="text-kawaii-pink">{song.author}</span>
                          <span>·</span>
                          <span>{formatCount(stats.playCount ?? 0)} 播放</span>
                          <span>·</span>
                          <span>{timeAgo(song.publishTime)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gradient-flow">{song.score.toFixed(1)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!searchTerm && (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3 text-kawaii-muted" aria-hidden="true">♩</p>
            <p className="text-sm text-kawaii-muted font-medium">输入关键词搜索歌曲</p>
          </div>
        )}
      </div>
    </main>
  );
}
