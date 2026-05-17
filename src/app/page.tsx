'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';
import { useAuth } from '@/components/AuthContext';

// ─── 排行榜条目 ───

function RankEntry({ song, rank }: { song: any; rank: number }) {
  const stats = parseStats(song.statistics);
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';

  return (
    <a href={`/song/${song.bvId}`} target="_blank" rel="noopener noreferrer" className="rank-item group">
      <span className={`rank-number ${rankClass}`}>{rank}</span>
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white ring-1 ring-kawaii-border/50">
        {song.picUrl ? (
          <img
            {...coverImgProps(song.picUrl)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-kawaii-muted">♪</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-kawaii-muted truncate">{song.author}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-kawaii-muted">{formatCount(stats.playCount ?? 0)}</p>
        <p className="text-xs font-bold text-kawaii-cyan">{song.score.toFixed(1)}</p>
      </div>
    </a>
  );
}

// ─── 歌曲卡片 ───

function SongCard({ song }: { song: any }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);

  return (
    <a href={`/song/${song.bvId}`} target="_blank" rel="noopener noreferrer" className="song-card group">
      <div className="relative aspect-[16/9] bg-kawaii-pink-pale overflow-hidden rounded-t-xl">
        {img.src ? (
          <img
            {...img}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-kawaii-muted text-4xl">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
        <div className="song-card-badge">★ {song.score.toFixed(1)}</div>
        <div className="absolute bottom-2 right-2 text-[10px] text-kawaii-muted bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
          ▶ {formatCount(stats.playCount ?? 0)}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-kawaii-muted truncate">{song.author}</p>
        <div className="flex items-center justify-between text-xs text-kawaii-muted">
          <span>{formatCount(stats.playCount ?? 0)} 播放</span>
          <span>{timeAgo(song.publishTime)}</span>
        </div>
      </div>
    </a>
  );
}

// ─── 顶部歌曲卡片（封面铺满整卡）───

function MiniSongCard({ song, label }: { song: any; label: string }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  return (
    <div className="relative h-full group cursor-pointer overflow-hidden rounded-2xl">
      <div className="absolute inset-0 overflow-hidden">
        {img.src ? (
          <img
            {...img}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-kawaii-pink-pale text-kawaii-muted text-4xl">♪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-white/10" />
      </div>
      <div className="relative z-10 p-5 h-full flex flex-col justify-end min-h-[160px]">
        <p className="text-[11px] text-kawaii-muted tracking-wider mb-1.5 font-medium">{label}</p>
        <p className="text-lg font-black text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors drop-shadow-sm">
          {song.title}
        </p>
        <p className="text-sm text-kawaii-text/70 truncate mt-0.5 font-medium">{song.author}</p>
        <div className="flex items-center gap-1.5 mt-2 text-sm text-kawaii-text/60 font-medium">
          <span className="text-kawaii-pink">▶</span>
          <span>{formatCount(stats.playCount ?? 0)} 播放</span>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ───

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rgb-card">
      <p className="stat-value">{value}</p>
      <p className="text-xs text-kawaii-muted mt-1 tracking-wider font-medium">{label}</p>
    </div>
  );
}

// ─── 页面 ───

export default function HomePage() {
  const { user, logout } = useAuth();
  const { data: pageData, isLoading } = trpc.analytics.getHomepage.useQuery();
  const stats = pageData?.stats;
  const latestSong = pageData?.latestSong;
  const weeklyHotSong = pageData?.weeklyHotSong;
  const dailyRanking = pageData?.dailyRanking ?? [];
  const weeklyRanking = pageData?.weeklyRanking ?? [];
  const latestSongs = pageData?.latestSongs ?? [];

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      {/* ─── 顶栏 ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">♪</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">
              VOCALOID HUB
            </h1>
          </div>
          <nav className="flex items-center gap-5 text-sm font-bold text-kawaii-muted">
            <a href="/recommend" className="hover:text-kawaii-pink transition-colors">推荐</a>
            <a href="/ranking" className="hover:text-kawaii-cyan transition-colors">排行榜</a>
            <a href="/milestones" className="hover:text-kawaii-yellow transition-colors">里程碑</a>
            <a href="/authors" className="hover:text-kawaii-cyan transition-colors">创作者</a>
            <a href="/analytics" className="hover:text-kawaii-purple transition-colors">数据分析</a>
            <a href="/forum" className="hover:text-kawaii-pink transition-colors">论坛</a>
            <a href="/about" className="hover:text-kawaii-cyan transition-colors">关于</a>
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-kawaii-border">
                <span className="text-sm text-kawaii-muted">{user.username}</span>
                <button onClick={logout} className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors">退出</button>
              </div>
            ) : (
              <a href="/login" className="btn btn-pink !py-1.5 !px-4 text-xs">登录</a>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-14 relative z-10">
        {/* ─── HERO ─── */}
        <section className="py-10">
          <div className="text-center relative">
            <div className="flex justify-center gap-2 mb-4" aria-hidden="true">
              <span className="float-element text-2xl opacity-40">✧</span>
              <span className="music-float text-2xl opacity-40">♫</span>
              <span className="float-element-delay text-2xl opacity-40">⋆</span>
              <span className="music-float-delay text-2xl opacity-40">♩</span>
              <span className="float-element text-2xl opacity-40" style={{animationDelay: '0.5s'}}>✦</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-kawaii-text mb-2">
              VOCALOID
            </h2>
            <p className="text-sm text-kawaii-muted tracking-[0.25em] uppercase mb-4 font-medium">
              虚拟歌手原创音乐平台
            </p>
            <p className="text-base text-kawaii-text/60 font-medium">
              探索初音未来 · 洛天依 · 众多虚拟歌手的原创音乐
            </p>

            <div className="flex justify-center gap-3 mt-6" aria-hidden="true">
              <span className="px-4 py-2 rounded-full bg-white/60 text-kawaii-pink text-xs font-bold shadow-sm">♪ 初音ミク</span>
              <span className="px-4 py-2 rounded-full bg-white/60 text-kawaii-cyan text-xs font-bold shadow-sm">♪ 洛天依</span>
              <span className="px-4 py-2 rounded-full bg-white/60 text-kawaii-purple text-xs font-bold shadow-sm">♪ 鏡音リン</span>
            </div>
          </div>
        </section>

        {/* ─── 顶部概览卡片：4列 ─── */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="本日新曲" value={formatCount(stats?.todaySongs ?? 0)} />
              {latestSong ? (
                <a href={`/song/${latestSong.bvId}`} target="_blank" rel="noopener noreferrer" className="group">
                  <MiniSongCard song={latestSong} label="最新投稿" />
                </a>
              ) : (
                <StatCard label="最新投稿" value="暂无" />
              )}
              {weeklyHotSong ? (
                <a href={`/song/${weeklyHotSong.bvId}`} target="_blank" rel="noopener noreferrer" className="group">
                  <MiniSongCard song={weeklyHotSong} label="本周最热" />
                </a>
              ) : (
                <StatCard label="本周最热" value="暂无" />
              )}
              <StatCard label="本周新曲" value={formatCount(stats?.weekSongs ?? 0)} />
            </div>
          )}
        </section>

        {/* ─── 排行榜 ─── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title text-kawaii-text">排行榜</h2>
            <a href="/ranking" className="btn btn-cyan !py-1.5 !px-4 text-xs">
              查看全部 →
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {/* 日榜 */}
            <div className="card">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-kawaii-cyan text-base" aria-hidden="true">☀</span>
                    <h3 className="text-sm font-black text-kawaii-cyan tracking-wider uppercase">日榜</h3>
                  </div>
                  <span className="text-[10px] font-bold text-kawaii-muted bg-kawaii-surface px-2.5 py-1 rounded-full">DAILY</span>
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
                    ))}
                  </div>
                ) : dailyRanking.length === 0 ? (
                  <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>
                ) : (
                  <div className="space-y-0.5">
                    {dailyRanking.slice(0, 8).map((song: any, i: number) => (
                      <RankEntry key={song.id} song={song} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 周榜 */}
            <div className="card">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-kawaii-pink text-base" aria-hidden="true">◈</span>
                    <h3 className="text-sm font-black text-kawaii-pink tracking-wider uppercase">周榜</h3>
                  </div>
                  <span className="text-[10px] font-bold text-kawaii-muted bg-kawaii-surface px-2.5 py-1 rounded-full">WEEKLY</span>
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
                    ))}
                  </div>
                ) : weeklyRanking.length === 0 ? (
                  <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>
                ) : (
                  <div className="space-y-0.5">
                    {weeklyRanking.slice(0, 8).map((song: any, i: number) => (
                      <RankEntry key={song.id} song={song} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="divider-cute" />

        {/* ─── 最新发布 ─── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="section-title text-kawaii-text">最新发布</h2>
            <span className="text-lg music-float opacity-40" aria-hidden="true">♪</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white/60 animate-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : latestSongs.length === 0 ? (
            <p className="text-kawaii-muted font-medium">暂无数据</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {latestSongs.map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        {/* ─── 底部 ─── */}
        <section className="text-center py-10 space-y-4">
          <p className="text-xs text-kawaii-muted/50 tracking-widest uppercase font-medium">
            VOCALOID HUB · Virtual Singer Original Music
          </p>
          <div className="flex justify-center gap-4 text-lg opacity-20" aria-hidden="true">
            <span className="music-float">♫</span>
            <span className="music-float-delay">♩</span>
            <span className="music-float" style={{animationDelay: '0.5s'}}>♬</span>
            <span className="music-float" style={{animationDelay: '1.5s'}}>♪</span>
          </div>
          <div className="flex justify-center gap-1 text-xs text-kawaii-muted/30">
            <span>⋆｡°✩ 用 ♡ 发电 ✩°｡⋆</span>
          </div>
        </section>
      </div>
    </main>
  );
}
