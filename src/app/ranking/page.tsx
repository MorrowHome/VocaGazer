'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

const TABS = [
  { key: 'daily', label: '日榜 🌅' },
  { key: 'weekly', label: '周榜 📅' },
  { key: 'monthly', label: '月榜 🌙' },
  { key: 'alltime', label: '总榜 🏆' },
] as const;

type Period = (typeof TABS)[number]['key'];

const STAT_COLORS: Record<string, { label: string; textClass: string; bgClass: string }> = {
  playCount:   { label: '播放', textClass: 'text-cyan-400',   bgClass: 'bg-cyan-500/10' },
  likes:       { label: '点赞', textClass: 'text-pink-400',   bgClass: 'bg-pink-500/10' },
  coins:       { label: '投币', textClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
  favorites:   { label: '收藏', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10' },
  shares:      { label: '分享', textClass: 'text-green-400',  bgClass: 'bg-green-500/10' },
  comments:    { label: '评论', textClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
};

// ─── 排行条目 ───
function RankCard({ song, rank, entryScore }: { song: any; rank: number; entryScore: number }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';

  return (
    <div className="group relative">
      <a
        href={`/song/${song.bvId}`}
        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all group/card border border-transparent hover:border-white/10"
      >
        <div className="flex flex-col items-center shrink-0 w-10 mt-1">
          <span className={`rank-number ${rankClass}`}>{rank}</span>
          {rank <= 3 && (
            <span className="text-[8px] text-gray-600 -mt-1">
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          )}
        </div>

        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 ring-1 ring-white/10">
          {img.src ? (
            <img {...img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700 text-xl">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-white font-bold truncate group-hover/card:text-vocaloid-cyan transition-colors text-base">
            {song.title}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{song.author}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {Object.entries(STAT_COLORS).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              if (val === 0) return null;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.bgClass} ${cfg.textClass} border border-white/5`}
                >
                  {cfg.label} {formatCount(val)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-right shrink-0 mt-1">
          <p className="text-[10px] text-gray-600 tracking-widest uppercase">Score</p>
          <p className="text-2xl font-black text-gradient-flow">{entryScore.toFixed(1)}</p>
        </div>
      </a>

      <a
        href={`https://www.bilibili.com/video/${song.bvId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[11px] text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 hover:border-vocaloid-cyan/30 flex items-center gap-1.5"
        title="在B站观看原视频"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.562 3.76v7.36c-.038 1.51-.558 2.765-1.562 3.761s-2.263 1.52-3.773 1.574H5.333c-1.51-.054-2.769-.578-3.773-1.574C.556 20.112.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.562-3.76 1.004-.996 2.263-1.52 3.773-1.574h.773l-1.334-1.6a.96.96 0 0 1-.16-.907.914.914 0 0 1 .623-.533c.249-.071.507-.053.742.053a.96.96 0 0 1 .437.374L8.96 4.653h6.08l1.334-1.6a.96.96 0 0 1 .437-.374.872.872 0 0 1 .742-.053c.25.071.457.23.624.533a.96.96 0 0 1-.16.907l-1.204 1.587zM5.333 16.68c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64zm13.334 0c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64z"/>
        </svg>
        B站
      </a>
    </div>
  );
}

// ─── 页面 ───
export default function RankingPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const { data: rankings, isLoading } = trpc.rankings.get.useQuery({ period, limit: 100 });

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-vocaloid-cyan transition-colors">&larr; 返回</a>
            <h1 className="text-lg font-bold tracking-wider text-gradient-flow">
              排行榜
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* 标签 */}
        <div className="rgb-border inline-flex mb-6">
          <div className="rgb-border-content !p-1 !bg-white/5 flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all tracking-wider ${
                  period === tab.key
                    ? 'bg-gradient-to-r from-vocaloid-purple to-vocaloid-cyan text-white shadow-lg shadow-vocaloid-purple/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs">
          {Object.values(STAT_COLORS).map((cfg) => (
            <span key={cfg.label} className="inline-flex items-center gap-1.5 text-gray-500">
              <span className={`w-2 h-2 rounded-full ${cfg.bgClass.replace('/10', '/70')}`} />
              {cfg.label}
            </span>
          ))}
          <span className="ml-auto text-gray-600 bg-white/5 px-3 py-1 rounded-full text-[11px]">
            {rankings?.length ?? 0} 首歌曲
          </span>
        </div>

        {/* 列表 */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !rankings || rankings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-6xl opacity-10 music-float" aria-hidden="true">♪</p>
            <p className="text-gray-500">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry: any, i: number) => {
              const rank = entry.rank ?? i + 1;
              const song = entry.song;
              if (!song) return null;
              return (
                <div key={entry.id} className="neon-border rounded-xl overflow-hidden">
                  <RankCard
                    song={song}
                    rank={rank}
                    entryScore={entry.score ?? song.score}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
