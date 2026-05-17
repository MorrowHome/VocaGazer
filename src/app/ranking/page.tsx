'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

const TABS = [
  { key: 'daily', label: '日榜' },
  { key: 'weekly', label: '周榜' },
  { key: 'monthly', label: '月榜' },
  { key: 'yearly', label: '年榜' },
  { key: 'alltime', label: '总榜' },
] as const;

type Period = (typeof TABS)[number]['key'];

const STAT_COLORS: Record<string, { label: string; color: string }> = {
  playCount:   { label: '播放', color: '#39BEB9' },
  likes:       { label: '点赞', color: '#FF6B9D' },
  coins:       { label: '投币', color: '#F7C94C' },
  favorites:   { label: '收藏', color: '#B388FF' },
  shares:      { label: '分享', color: '#A8D14B' },
  comments:    { label: '评论', color: '#FFB08C' },
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
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 p-4 rounded-xl hover:bg-kawaii-surface transition-all group/card"
      >
        <div className="flex flex-col items-center shrink-0 w-10 mt-1">
          <span className={`rank-number ${rankClass}`}>{rank}</span>
          {rank <= 3 && (
            <span className={`text-[10px] font-black -mt-1 ${rank === 1 ? 'text-kawaii-pink' : rank === 2 ? 'text-kawaii-cyan' : 'text-kawaii-purple'}`}>
              {rank === 1 ? '★' : rank === 2 ? '◆' : '◇'}
            </span>
          )}
        </div>

        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white ring-1 ring-kawaii-border/50">
          {img.src ? (
            <img {...img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-kawaii-muted text-xl">♪</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-kawaii-text font-black truncate group-hover/card:text-kawaii-pink transition-colors text-base">
            {song.title}
          </p>
          <p className="text-sm text-kawaii-muted mt-0.5 font-medium">{song.author}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {Object.entries(STAT_COLORS).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              if (val === 0) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/70 border border-kawaii-border/50"
                  style={{ color: cfg.color }}
                >
                  {cfg.label} {formatCount(val)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-right shrink-0 mt-1">
          <p className="text-[10px] text-kawaii-muted tracking-widest uppercase font-bold">Score</p>
          <p className="text-2xl font-black text-gradient-flow">{entryScore.toFixed(1)}</p>
        </div>
      </a>

      <a
        href={`https://www.bilibili.com/video/${song.bvId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[11px] font-bold text-kawaii-muted hover:text-kawaii-pink bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-kawaii-border hover:border-kawaii-pink/30 flex items-center gap-1.5 shadow-sm"
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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { data: availableDates } = trpc.rankings.getAvailableDates.useQuery(
    { period },
    { enabled: period !== 'alltime' },
  );
  const { data: rankings, isLoading } = trpc.rankings.get.useQuery({
    period,
    limit: 100,
    date: selectedDate || null,
  });

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回</a>
            <span aria-hidden="true" className="text-kawaii-pink">◈</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">排行榜</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* 标签 */}
        <div className="flex gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setPeriod(tab.key);
                setSelectedDate('');
              }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                period === tab.key
                  ? 'bg-kawaii-pink text-white shadow-md'
                  : 'bg-white/70 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 日期选择 + 图例 */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-kawaii-muted font-medium">
          {period !== 'alltime' && (
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-full border border-kawaii-border">
              <span>📅</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-kawaii-text outline-none font-medium [color-scheme:light]"
                max={new Date().toISOString().slice(0, 10)}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-kawaii-muted hover:text-kawaii-pink ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {Object.values(STAT_COLORS).map((cfg) => (
            <span key={cfg.label} className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
          ))}
          <span className="ml-auto text-kawaii-muted bg-white/70 px-3 py-1 rounded-full text-[11px] font-bold">
            {rankings?.length ?? 0} 首歌曲
          </span>
        </div>

        {/* 列表 */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : !rankings || rankings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-6xl opacity-20 music-float text-kawaii-pink" aria-hidden="true">♪</p>
            <p className="text-kawaii-muted font-medium">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry: any, i: number) => {
              const rank = entry.rank ?? i + 1;
              const song = entry.song;
              if (!song) return null;
              return (
                <div key={entry.id} className="card overflow-hidden">
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
