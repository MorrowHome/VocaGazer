'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';
import { useAuth } from '@/components/AuthContext';
import { AdminDeleteSongButton } from '@/components/AdminDeleteSongButton';

function EditorPickBanner({ song, rank, featured }: { song: any; rank: number; featured?: boolean }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  return (
    <div className="relative">
    <a
      href={`/song/${song.bvId}`}
      className={`group relative block overflow-hidden rounded-[1.75rem] ring-1 ring-white/20 hover:ring-kawaii-pink/45 transition-all min-h-[50svh] ${
        featured ? 'lg:min-h-[70svh]' : ''
      }`}
    >
      {img.src ? (
        <img
          {...img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kawaii-pink/40 via-kawaii-purple/30 to-kawaii-cyan/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-kawaii-hero-void via-kawaii-hero-void/55 to-kawaii-hero-void/15" />
      <div className={`relative z-10 h-full flex flex-col justify-end p-6 md:p-10 lg:p-12 ${featured ? 'min-h-[50svh] lg:min-h-[70svh]' : 'min-h-[50svh]'}`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-kawaii-pink">编者推送</span>
          <span className="text-xs font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full ring-1 ring-white/20">#{rank}</span>
          <span className="text-xs font-black text-kawaii-pink bg-kawaii-hero-void/50 px-2.5 py-0.5 rounded-full ring-1 ring-kawaii-pink/30">
            ★ {Number(song.score).toFixed(1)}
          </span>
        </div>
        <h3 className="font-display font-bold text-white leading-tight line-clamp-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-lg">
          {song.title}
        </h3>
        <p className="mt-3 text-sm md:text-base text-white/75 font-medium">
          {song.author}
          <span className="opacity-40 mx-2">·</span>
          {formatCount(stats.playCount ?? 0)} 播放
          <span className="opacity-40 mx-2">·</span>
          {timeAgo(song.publishTime)}
        </p>
        {song.editorNote && (
          <p className="mt-5 max-w-2xl text-sm md:text-base text-white/88 leading-relaxed line-clamp-4 border-l-2 border-kawaii-pink/80 pl-4">
            {song.editorNote}
          </p>
        )}
        <p className="mt-6 text-xs font-bold tracking-[0.2em] uppercase text-white/50 group-hover:text-kawaii-pink transition-colors">
          打开歌曲 →
        </p>
      </div>
    </a>
    <AdminDeleteSongButton bvId={song.bvId} title={song.title} variant="overlay" />
    </div>
  );
}

// ─── 推荐歌曲卡片 ───
function RecSongCard({ song, rank }: { song: any; rank?: number }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  return (
    <div className="relative">
    <a
      href={`/song/${song.bvId}`}
      className="card overflow-hidden group hover:border-kawaii-pink/20 transition-all"
    >
      <div className="relative aspect-[16/10] bg-kawaii-surface overflow-hidden">
        {img.src ? (
          <img
            {...img}
            alt={song.title}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-kawaii-muted text-4xl">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-kawaii-hero-void/90 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 bg-kawaii-hero-void/75 backdrop-blur-sm text-xs font-bold text-kawaii-pink px-2.5 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
          ★ {song.score.toFixed(1)}
        </div>
        {rank && (
          <div className="absolute top-2 right-2 bg-kawaii-hero-void/75 backdrop-blur-sm text-xs font-bold text-kawaii-cyan px-2.5 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
            #{rank}
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[10px] font-bold text-kawaii-muted bg-kawaii-hero-void/75 px-2 py-0.5 rounded-full border border-kawaii-border/50 shadow-sm">
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
    <AdminDeleteSongButton bvId={song.bvId} title={song.title} variant="overlay" />
    </div>
  );
}

// ─── 页面 ───
export default function RecommendPage() {
  const { data, isLoading } = trpc.recommend.getRecommendations.useQuery();

  return (
    <main className="min-h-screen relative">


      <div className="site-shell py-8 space-y-10 relative z-10">
        {/* 编者推荐 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="section-title text-kawaii-text">编者推送</h2>
          </div>
          {isLoading ? (
            <div className="space-y-5">
              <div className="rounded-[1.75rem] bg-kawaii-surface/50 animate-pulse min-h-[50svh]" />
              <div className="rounded-[1.75rem] bg-kawaii-surface/50 animate-pulse min-h-[50svh]" />
            </div>
          ) : !data?.editorPicks?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无</p>
          ) : (
            <div className="space-y-5">
              {data.editorPicks.map((song: any, i: number) => (
                <EditorPickBanner key={song.id} song={song} rank={i + 1} featured={i === 0} />
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 本周上升 */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="section-title text-kawaii-text">本周上升</h2>
          </div>
          {isLoading ? (
            <div className="song-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-kawaii-surface/50 animate-pulse aspect-[16/10]" />)}
            </div>
          ) : !data?.weeklyRising?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无</p>
          ) : (
            <div className="song-grid">
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
            <h2 className="section-title text-kawaii-text">今日新曲</h2>
          </div>
          {isLoading ? (
            <div className="song-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl bg-kawaii-surface/50 animate-pulse aspect-[16/10]" />)}
            </div>
          ) : !data?.todayNew?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">今天还没有新曲入库</p>
          ) : (
            <div className="song-grid">
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
  if (!user) return null;
  if (!data) return null;
  if (data.reason === 'empty') return null;
  return (
    <>
      <div className="divider-cute" />
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="section-title text-kawaii-text">收藏相关</h2>
        </div>
        <div className="song-grid">
          {data.songs.map((song: any) => (
            <RecSongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </>
  );
}
