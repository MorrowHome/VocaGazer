'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

// ─── 推荐歌曲卡片 ───
function RecSongCard({ song, rank }: { song: any; rank?: number }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  return (
    <a
      href={`/song/${song.bvId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="card overflow-hidden group hover:border-kawaii-pink/20 transition-all"
    >
      <div className="relative aspect-[16/9] bg-kawaii-surface overflow-hidden">
        {img.src ? (
          <img
            {...img}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-kawaii-muted text-4xl">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-bold text-kawaii-pink px-2.5 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
          ★ {song.score.toFixed(1)}
        </div>
        {rank && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-bold text-kawaii-cyan px-2.5 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
            #{rank}
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[10px] font-bold text-kawaii-muted bg-white/90 px-2 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
          ▶ {formatCount(stats.playCount ?? 0)}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-black text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-kawaii-muted font-medium truncate">{song.author}</p>
        <div className="flex items-center justify-between text-xs text-kawaii-muted font-medium">
          <span>{formatCount(stats.playCount ?? 0)} 播放</span>
          <span>{timeAgo(song.publishTime)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── 页面 ───
export default function RecommendPage() {
  const { data, isLoading } = trpc.recommend.getRecommendations.useQuery();

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回</a>
            <span className="text-lg text-kawaii-pink" aria-hidden="true">✦</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">特别推荐</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 relative z-10">
        {/* 编辑推荐 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">◆</span>
            <h2 className="section-title text-kawaii-text">编辑推荐</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">评分最高的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.editorPicks?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.editorPicks.map((song: any, i: number) => (
                <RecSongCard key={song.id} song={song} rank={i + 1} />
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 热门推荐 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">▶</span>
            <h2 className="section-title text-kawaii-text">热门推荐</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">播放量最高的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.hotSongs?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.hotSongs.map((song: any) => (
                <RecSongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 最新发布 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-cyan" aria-hidden="true">♪</span>
            <h2 className="section-title text-kawaii-text">最新发布</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">最新上传的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.recentPicks?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.recentPicks.map((song: any) => (
                <RecSongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
