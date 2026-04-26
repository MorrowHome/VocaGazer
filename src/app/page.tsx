'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

// ─── 霓虹装饰条 ───

function NeonDecoration() {
  return (
    <div className="neon-decoration" aria-hidden="true">
      {[1,2,3,4,5,6,7].map((i) => (
        <div key={i} className="bar" />
      ))}
    </div>
  );
}

// ─── 排行榜条目 ───

function RankEntry({ song, rank }: { song: any; rank: number }) {
  const stats = parseStats(song.statistics);
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';

  return (
    <a href={`/song/${song.bvId}`} className="rank-item group">
      <span className={`rank-number ${rankClass}`}>{rank}</span>
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 ring-1 ring-white/10">
        {song.picUrl ? (
          <img
            {...coverImgProps(song.picUrl)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">♪</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate group-hover:text-vocaloid-cyan transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-gray-500 truncate">{song.author}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">{formatCount(stats.playCount ?? 0)}</p>
        <p className="text-xs font-semibold text-vocaloid-cyan">{song.score.toFixed(1)}</p>
      </div>
    </a>
  );
}

// ─── 歌曲卡片 ───

function SongCard({ song }: { song: any }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);

  return (
    <a href={`/song/${song.bvId}`} className="song-card group">
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

export default function HomePage() {
  const { data: pageData, isLoading } = trpc.analytics.getHomepage.useQuery();
  const stats = pageData?.stats;
  const dailyRanking = pageData?.dailyRanking ?? [];
  const weeklyRanking = pageData?.weeklyRanking ?? [];
  const latestSongs = pageData?.latestSongs ?? [];

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      {/* ─── 顶栏 ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neon-avatar neon-avatar-small hidden sm:flex" aria-hidden="true">♪</div>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-gradient-flow">
                VOCALOID HUB
              </h1>
              <p className="text-[9px] text-gray-600 tracking-widest uppercase -mt-0.5">Virtual Singer Music</p>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/ranking" className="hover:text-vocaloid-cyan transition-colors flex items-center gap-1">
              <span>🏆</span> 排行榜
            </a>
            <a href="/analytics" className="hover:text-vocaloid-cyan transition-colors">📊 数据分析</a>
            <a href="/forum" className="hover:text-vocaloid-cyan transition-colors">💬 论坛</a>
            <a href="/about" className="hover:text-vocaloid-cyan transition-colors">❓ 关于</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12 relative z-10">
        {/* ─── HERO ─── */}
        <section className="relative py-8">
          <div className="text-center relative">
            <div className="flex justify-center mb-4">
              <NeonDecoration />
            </div>

            {/* 二次元可爱装饰 */}
            <div className="flex justify-center gap-2 mb-2" aria-hidden="true">
              <span className="float-element text-lg">🌸</span>
              <span className="music-float text-lg">♫</span>
              <span className="float-element-delay text-sm">✦</span>
              <span className="music-float-delay text-lg">♩</span>
              <span className="float-element text-lg" style={{animationDelay: '0.5s'}}>💫</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-neon-flicker tracking-wider mb-1">
              VOCALOID
            </h2>
            <p className="text-xs text-gray-600 tracking-[0.4em] uppercase mb-3">Powered by Neon</p>
            <p className="text-base md:text-lg text-gray-400 tracking-widest">
              <span className="text-glow-cyan">♪</span> 探索虚拟歌手的原创音乐世界{' '}
              <span className="text-glow-pink">♪</span>
            </p>

            {/* 浮动音符 */}
            <div className="flex justify-center gap-4 mt-4" aria-hidden="true">
              <span className="music-float text-xl text-glow-cyan">♫</span>
              <span className="music-float-delay text-xl text-glow-pink">♩</span>
              <span className="music-float text-xl text-glow-purple" style={{animationDelay: '0.5s'}}>♬</span>
              <span className="music-float text-xl text-glow-cyan" style={{animationDelay: '1.5s'}}>♪</span>
            </div>

            <div className="flex justify-center mt-4">
              <NeonDecoration />
            </div>
          </div>
        </section>

        {/* ─── 统计栏 ─── */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="歌曲总数" value={formatCount(stats?.totalSongs ?? 0)} emoji="🎵" />
              <StatCard label="今日新曲" value={formatCount(stats?.todaySongs ?? 0)} emoji="✨" />
              <StatCard label="总播放量" value={formatCount(stats?.totalPlayCount ?? 0)} emoji="▶" />
            </div>
          )}
        </section>

        {/* ─── 排行榜 ─── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl float-element" aria-hidden="true">🏆</span>
              <h2 className="section-title text-xl text-white">排行榜</h2>
            </div>
            <a href="/ranking" className="neon-btn !py-1.5 !px-4 text-xs">
              查看全部 &rarr;
            </a>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 日榜 */}
            <div className="rgb-border">
              <div className="rgb-border-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-glow-cyan text-lg" aria-hidden="true">☀</span>
                    <h3 className="text-sm font-bold text-glow-cyan tracking-widest uppercase">
                      日榜
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">DAILY</span>
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : dailyRanking.length === 0 ? (
                  <p className="text-gray-600 text-sm">暂无数据</p>
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
            <div className="rgb-border">
              <div className="rgb-border-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-glow-pink text-lg" aria-hidden="true">◈</span>
                    <h3 className="text-sm font-bold text-glow-pink tracking-widest uppercase">
                      周榜
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">WEEKLY</span>
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : weeklyRanking.length === 0 ? (
                  <p className="text-gray-600 text-sm">暂无数据</p>
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
          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl float-element" aria-hidden="true">🌸</span>
            <h2 className="section-title text-xl text-white">最新发布</h2>
            <span className="text-xl music-float-delay" aria-hidden="true">♪</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : latestSongs.length === 0 ? (
            <p className="text-gray-600">暂无数据</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {latestSongs.map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        {/* ─── 底部 ─── */}
        <section className="text-center py-8 space-y-4">
          <div className="flex justify-center gap-4 text-2xl opacity-40" aria-hidden="true">
            <span className="music-float">♫</span>
            <span className="music-float-delay">♩</span>
            <span className="music-float" style={{animationDelay: '0.5s'}}>♬</span>
            <span className="music-float" style={{animationDelay: '1.5s'}}>♪</span>
          </div>
          <NeonDecoration />
          <p className="text-[10px] text-gray-700 tracking-[0.3em] uppercase mt-4">
            VOCALOID HUB · Virtual Singer Original Music
          </p>
        </section>
      </div>
    </main>
  );
}

// ─── 统计卡片 ───

function StatCard({ label, value, emoji }: { label: string; value: string; emoji?: string }) {
  return (
    <div className="rgb-card">
      {emoji && <span className="text-2xl block mb-2">{emoji}</span>}
      <p className="stat-value text-3xl md:text-4xl">{value}</p>
      <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">{label}</p>
    </div>
  );
}
