'use client';

import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, timeAgo, coverImgProps } from '@/lib/utils';

// ─── 排行榜条目 ───

function RankEntry({ song, rank }: { song: any; rank: number }) {
  const stats = parseStats(song.statistics);
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';

  return (
    <a href={`/song/${song.bvId}`} className="rank-item group">
      <span className={`rank-number ${rankClass}`}>{rank}</span>
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
        {song.picUrl ? (
          <img
            {...coverImgProps(song.picUrl)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
            ♪
          </div>
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

// ─── 歌曲卡片（带封面） ───

function SongCard({ song }: { song: any }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);

  return (
    <a
      href={`/song/${song.bvId}`}
      className="song-card rounded-xl group"
    >
      {/* 封面 */}
      <div className="relative aspect-[16/9] bg-white/5 overflow-hidden">
        {img.src ? (
          <img
            {...img}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">
            ♪
          </div>
        )}
        {/* 渐变覆盖 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--background))] via-transparent to-transparent" />
        {/* 分数角标 */}
        <div className="song-card-badge">
          {song.score.toFixed(1)}
        </div>
      </div>

      {/* 文字信息 */}
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
    <main className="min-h-screen">
      {/* ─── 顶栏 ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-vocaloid-cyan to-vocaloid-pink bg-clip-text text-transparent">
            VOCALOID HUB
          </h1>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/ranking" className="hover:text-vocaloid-cyan transition-colors">排行榜</a>
            <a href="/analytics" className="hover:text-vocaloid-cyan transition-colors">数据分析</a>
            <a href="/forum" className="hover:text-vocaloid-cyan transition-colors">论坛</a>
            <a href="/about" className="hover:text-vocaloid-cyan transition-colors">关于</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* ─── 统计栏 ─── */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="歌曲总数" value={formatCount(stats?.totalSongs ?? 0)} />
              <StatCard label="今日新曲" value={formatCount(stats?.todaySongs ?? 0)} />
              <StatCard label="总播放量" value={formatCount(stats?.totalPlayCount ?? 0)} />
            </div>
          )}
        </section>

        {/* ─── 排行榜 日榜 | 周榜 ─── */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">排行榜</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* 日榜 */}
            <div className="neon-rank rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-vocaloid-cyan tracking-widest uppercase">
                  今日日榜
                </h3>
                <span className="text-[10px] text-gray-500">DAILY</span>
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

            {/* 周榜 */}
            <div className="neon-rank rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-vocaloid-pink tracking-widest uppercase">
                  本周周榜
                </h3>
                <span className="text-[10px] text-gray-500">WEEKLY</span>
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
        </section>

        <div className="divider-gradient" />

        {/* ─── 最新发布 ─── */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">最新发布</h2>
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
      </div>
    </main>
  );
}

// ─── 统计卡片 ───

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="neon-border rounded-2xl p-5 text-center">
      <p className="stat-value text-3xl md:text-4xl">{value}</p>
      <p className="text-xs text-gray-500 mt-1 tracking-wider">{label}</p>
    </div>
  );
}
