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
      className="song-card rounded-xl group"
    >
      <div className="relative aspect-[16/9] bg-white/5 overflow-hidden rounded-t-xl">
        {img.src ? (
          <img
            {...img}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--background))] via-transparent to-transparent" />
        <div className="song-card-badge">★ {song.score.toFixed(1)}</div>
        {rank && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-xs font-bold text-white px-2.5 py-0.5 rounded-lg border border-white/10">
            #{rank}
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
          ▶ {formatCount(stats.playCount ?? 0)}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold text-white truncate group-hover:text-vocaloid-cyan transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-gray-500 truncate">{song.author}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
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

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-vocaloid-cyan transition-colors">&larr; 返回</a>
            <h1 className="text-lg font-bold tracking-wider text-gradient-flow">特别推荐</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12 relative z-10">
        {/* 编辑推荐 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">⭐</span>
            <h2 className="section-title text-xl text-white">编辑推荐</h2>
            <span className="text-xs text-gray-500 ml-auto">评分最高的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.editorPicks?.length ? (
            <p className="text-gray-600">暂无数据</p>
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
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔥</span>
            <h2 className="section-title text-xl text-white">热门推荐</h2>
            <span className="text-xs text-gray-500 ml-auto">播放量最高的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.hotSongs?.length ? (
            <p className="text-gray-600">暂无数据</p>
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
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🆕</span>
            <h2 className="section-title text-xl text-white">最新发布</h2>
            <span className="text-xs text-gray-500 ml-auto">最新上传的歌曲</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.recentPicks?.length ? (
            <p className="text-gray-600">暂无数据</p>
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
