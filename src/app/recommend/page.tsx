'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';
import { useAuth } from '@/components/AuthContext';

// ─── 推荐歌曲卡片 ───
function RecSongCard({ song, rank }: { song: any; rank?: number }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  return (
    <a
      href={`/song/${song.bvId}`}
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


      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 relative z-10">
        {/* 编者推荐 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">◆</span>
            <h2 className="section-title text-kawaii-text">编者推送</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">管理员手动挑选</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.editorPicks?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">还没有编者推送，去管理台加几首吧</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.editorPicks.map((song: any, i: number) => (
                <div key={song.id}>
                  <RecSongCard song={song} rank={i + 1} />
                  {song.editorNote && (
                    <p className="text-[11px] text-kawaii-muted font-medium mt-1.5 px-1 line-clamp-2">{song.editorNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 本周上升 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">▶</span>
            <h2 className="section-title text-kawaii-text">本周上升</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">本自然周排行快照</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.weeklyRising?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">周榜将在采集后生成</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.weeklyRising.map((song: any) => (
                <RecSongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 今日新曲 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-kawaii-cyan" aria-hidden="true">♪</span>
            <h2 className="section-title text-kawaii-text">今日新曲</h2>
            <span className="text-xs text-kawaii-muted font-medium ml-auto">中国日历今日发布</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />)}
            </div>
          ) : !data?.todayNew?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">今天还没有新曲入库</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {data.todayNew.map((song: any) => (
                <RecSongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        <ForYouSection />
      </div>
    </main>
  );
}

function ForYouSection() {
  const { user } = useAuth();
  const { data } = trpc.recommend.forYou.useQuery(undefined, { enabled: !!user, retry: false });
  if (!user) {
    return (
      <>
        <div className="divider-cute" />
        <section>
          <h2 className="section-title text-kawaii-text mb-3">因为你收藏了</h2>
          <p className="text-sm text-kawaii-muted font-medium">登录后根据收藏来推荐同作者作品</p>
        </section>
      </>
    );
  }
  if (!data) return null;
  return (
    <>
      <div className="divider-cute" />
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-lg text-kawaii-purple" aria-hidden="true">♡</span>
          <h2 className="section-title text-kawaii-text">因为你收藏了</h2>
        </div>
        {data.reason === 'empty' ? (
          <p className="text-sm text-kawaii-muted font-medium">登录并收藏几首后，这里会按同作者推荐</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {data.songs.map((song: any) => (
              <RecSongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
