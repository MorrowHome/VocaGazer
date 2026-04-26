'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';

const TABS = [
  { key: 'daily', label: '日榜' },
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'alltime', label: '总榜' },
] as const;

type Period = (typeof TABS)[number]['key'];

// ─── 各数据指标的颜色映射 ───
const STAT_COLORS: Record<string, { label: string; textClass: string; bgClass: string }> = {
  playCount:   { label: '播放', textClass: 'text-cyan-400',   bgClass: 'bg-cyan-500/10' },
  likes:       { label: '点赞', textClass: 'text-pink-400',   bgClass: 'bg-pink-500/10' },
  coins:       { label: '投币', textClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
  favorites:   { label: '收藏', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10' },
  shares:      { label: '分享', textClass: 'text-green-400',  bgClass: 'bg-green-500/10' },
  comments:    { label: '评论', textClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
};

// ─── 排行条目组件 ───
function RankCard({ song, rank, entryScore }: { song: any; rank: number; entryScore: number }) {
  const stats = parseStats(song.statistics);
  const img = coverImgProps(song.picUrl);
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';

  return (
    <div className="group relative">
      <a
        href={`/song/${song.bvId}`}
        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
      >
        {/* 排名 */}
        <span className={`rank-number text-xl mt-1 ${rankClass}`}>{rank}</span>

        {/* 封面 */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 ring-1 ring-white/10">
          {img.src ? (
            <img {...img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700 text-xl">♪</div>
          )}
        </div>

        {/* 信息 + 统计数据 */}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold truncate group-hover:text-vocaloid-cyan transition-colors">
            {song.title}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{song.author}</p>

          {/* 六维数据条 */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {Object.entries(STAT_COLORS).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              if (val === 0) return null;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg.bgClass} ${cfg.textClass} border border-white/5`}
                >
                  {cfg.label} {formatCount(val)}
                </span>
              );
            })}
          </div>
        </div>

        {/* 综合评分 */}
        <div className="text-right shrink-0 mt-1">
          <p className="text-xs text-gray-500 tracking-wider">评分</p>
          <p className="text-xl font-black text-gradient-flow">{entryScore.toFixed(1)}</p>
        </div>
      </a>

      {/* B站快捷链接 */}
      <a
        href={`https://www.bilibili.com/video/${song.bvId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-600 hover:text-vocaloid-cyan bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md"
        title="在B站观看"
      >
        B站 ↗
      </a>
    </div>
  );
}

// ─── 页面 ───
export default function RankingPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const { data: rankings, isLoading } = trpc.rankings.get.useQuery({ period, limit: 100 });

  return (
    <main className="min-h-screen">
      {/* 顶栏 */}
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

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* 标签切换 */}
        <div className="rgb-border inline-flex mb-6">
          <div className="rgb-border-content !p-1 !bg-white/5 flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === tab.key
                    ? 'bg-gradient-to-r from-vocaloid-purple to-vocaloid-cyan text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 统计图例 */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs text-gray-500">
          {Object.values(STAT_COLORS).map((cfg) => (
            <span key={cfg.label} className={`inline-flex items-center gap-1.5`}>
              <span className={`w-2 h-2 rounded-full ${cfg.bgClass.replace('/10', '/70')}`} />
              {cfg.label}
            </span>
          ))}
          <span className="ml-auto text-gray-600">
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
          <div className="text-center py-20">
            <p className="text-6xl mb-4 opacity-10">♪</p>
            <p className="text-gray-500">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-1">
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
