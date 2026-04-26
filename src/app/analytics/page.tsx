'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

type Range = '7d' | '30d' | '90d' | 'all';
const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: '90d', label: '近 90 天' },
  { key: 'all', label: '全部' },
];

const CHART_COLORS = [
  '#06B6D4', '#EC4899', '#A855F7', '#22D3EE', '#F97316',
  '#10B981', '#FBBF24', '#EF4444', '#8B5CF6', '#14B8A6',
];

// ─── 概览卡片 ───
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rgb-card">
      <p className="stat-value text-2xl md:text-3xl">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 tracking-wider uppercase">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── 横向柱状条 ───
function Bar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-gray-400 w-22 text-right truncate shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      <span className="text-xs text-gray-500 w-16 shrink-0 text-right font-mono">{value}{suffix ?? ''}</span>
    </div>
  );
}

// ─── 评分分布环形图 ───
function ScoreDonut({ dist }: { dist: number[] }) {
  const labels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const colors = ['#EF4444', '#F97316', '#FBBF24', '#22D3EE', '#A855F7'];
  const total = dist.reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-gray-600 text-sm">暂无数据</p>;

  let c = 0;
  const stops = dist.map((v, i) => {
    const p = (v / total) * 100;
    const s = c;
    c += p;
    return `${colors[i]} ${s}% ${c}%`;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="w-28 h-28 rounded-full shrink-0" style={{ background: `conic-gradient(${stops.join(', ')})`, boxShadow: '0 0 20px rgba(255,255,255,0.05)' }} />
      <div className="space-y-1.5">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-gray-400 w-12">{l}</span>
            <span className="text-gray-500 font-mono">{dist[i]}</span>
            <span className="text-gray-600 text-[10px]">{total > 0 ? ((dist[i] / total) * 100).toFixed(1) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 表格行 ───
function TableRow({ rank, song }: { rank: number; song: any; highlight?: boolean }) {
  return (
    <a
      href={`/song/${song.bvId}`}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
    >
      <span className="text-xs text-gray-600 w-6 text-right font-mono">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate group-hover:text-vocaloid-cyan transition-colors">{song.title}</p>
        <p className="text-[11px] text-gray-500 truncate">{song.author}</p>
      </div>
      <span className="text-xs text-gray-400 w-16 text-right font-mono">{formatCount(song.plays ?? 0)}</span>
      <span className="text-xs text-gray-500 w-12 text-right font-mono">{formatCount(song.likes ?? 0)}</span>
      <span className="text-xs font-bold w-14 text-right font-mono" style={{ color: song.score >= 60 ? '#06B6D4' : song.score >= 30 ? '#FBBF24' : '#EF4444' }}>
        {song.score.toFixed(1)}
      </span>
    </a>
  );
}

// ─── 页面 ───
export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('all');
  const { data, isLoading } = trpc.analytics.getAnalytics.useQuery({ range });

  const o = data?.overview;
  const e = data?.engagement;
  const maxTagCount = Math.max(...(data?.topTags.map((t) => t.count) ?? [1]));
  const maxArtistPlays = Math.max(...(data?.topArtists.map((a) => a.totalPlays) ?? [1]));

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-vocaloid-cyan transition-colors">&larr; 返回</a>
            <h1 className="text-lg font-bold tracking-wider text-gradient-flow">数据分析</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 relative z-10">
        {/* ── 时间范围选择器 ── */}
        <div className="rgb-border inline-flex">
          <div className="rgb-border-content !p-1 !bg-white/5 flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all tracking-wider ${
                  range === r.key
                    ? 'bg-gradient-to-r from-vocaloid-purple to-vocaloid-cyan text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 概览 ── */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">概览</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
                <StatCard label="歌曲总数" value={formatCount(o?.totalSongs ?? 0)} />
                <StatCard label="UP 主数" value={formatCount(o?.totalArtists ?? 0)} />
                <StatCard label="总播放" value={formatCount(o?.totalPlayCount ?? 0)} />
                <StatCard label="总点赞" value={formatCount(o?.totalLikeCount ?? 0)} />
                <StatCard label="总投币" value={formatCount(o?.totalCoinCount ?? 0)} />
                <StatCard label="总收藏" value={formatCount(o?.totalFavCount ?? 0)} />
                <StatCard label="平均评分" value={String(o?.avgScore ?? 0)} />
                <StatCard label="均播放/曲" value={formatCount(o?.avgPlaysPerSong ?? 0)} sub={`均赞 ${formatCount(o?.avgLikesPerSong ?? 0)}`} />
              </div>
            </>
          )}
        </section>

        <div className="divider-cute" />

        {/* ── 互动率 ── */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">互动率</h2>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <EngCard label="点赞率" value={`${e?.likePlayRatio ?? 0}%`} color="#EC4899" />
              <EngCard label="投币率" value={`${e?.coinPlayRatio ?? 0}%`} color="#FBBF24" />
              <EngCard label="收藏率" value={`${e?.favPlayRatio ?? 0}%`} color="#A855F7" />
              <EngCard label="分享率" value={`${e?.sharePlayRatio ?? 0}%`} color="#22D3EE" />
              <EngCard label="评论率" value={`${e?.commentPlayRatio ?? 0}%`} color="#F97316" />
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* ── 左侧：标签 + UP主 柱状图 ── */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="section-title text-lg text-white mb-6">🏷 标签分布</h2>
            {isLoading ? (
              <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-white/5 animate-pulse" />)}</div>
            ) : !data?.topTags?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
              <div className="space-y-2">{data.topTags.slice(0, 15).map((t, i) => (
                <Bar key={t.name} label={t.name} value={t.count} max={maxTagCount} color={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}</div>
            )}
          </section>

          <section>
            <h2 className="section-title text-lg text-white mb-6">🎤 热门 UP 主</h2>
            {isLoading ? (
              <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-white/5 animate-pulse" />)}</div>
            ) : !data?.topArtists?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
              <div className="space-y-2">{data.topArtists.slice(0, 15).map((a, i) => (
                <Bar key={a.name} label={a.name} value={a.totalPlays} max={maxArtistPlays} color={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}</div>
            )}
          </section>
        </div>

        <div className="divider-cute" />

        {/* ── 高评分 UP 主 ── */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">⭐ 高评分 UP 主（≥2首歌）</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
          ) : !data?.topRatedArtists?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.topRatedArtists.map((a, i) => (
                <div key={a.name} className="neon-border rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">#{i + 1}</p>
                  <p className="text-base font-bold text-white truncate">{a.name}</p>
                  <p className={`text-2xl font-black mt-1 ${i === 0 ? 'text-glow-cyan' : i === 1 ? 'text-glow-pink' : i === 2 ? 'text-glow-purple' : 'text-gray-300'}`}>
                    {a.avgScore}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{a.count} 首</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* ── 歌曲排名双表 ── */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">🏆</span>
              <h2 className="section-title text-lg text-white">评分排行</h2>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />)}</div>
            ) : !data?.topSongs?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
              <div className="neon-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 text-[10px] text-gray-600 uppercase tracking-wider">
                  <span className="w-6 text-right">#</span>
                  <span className="flex-1">歌曲</span>
                  <span className="w-16 text-right">播放</span>
                  <span className="w-12 text-right">点赞</span>
                  <span className="w-14 text-right">评分</span>
                </div>
                {data.topSongs.slice(0, 10).map((s, i) => <TableRow key={s.id} rank={i + 1} song={s} />)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">🔥</span>
              <h2 className="section-title text-lg text-white">播放排行</h2>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />)}</div>
            ) : !data?.mostPlayed?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
              <div className="neon-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 text-[10px] text-gray-600 uppercase tracking-wider">
                  <span className="w-6 text-right">#</span>
                  <span className="flex-1">歌曲</span>
                  <span className="w-16 text-right">播放</span>
                  <span className="w-12 text-right">点赞</span>
                  <span className="w-14 text-right">评分</span>
                </div>
                {data.mostPlayed.slice(0, 10).map((s, i) => <TableRow key={s.id} rank={i + 1} song={s} />)}
              </div>
            )}
          </section>
        </div>

        <div className="divider-cute" />

        {/* ── 月度趋势 + 评分分布 ── */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">📈</span>
              <h2 className="section-title text-lg text-white">发布趋势</h2>
            </div>
            {isLoading ? (
              <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ) : !data?.songsByMonth?.length ? <p className="text-gray-600 text-sm">暂无数据</p> : (
              <div className="neon-border rounded-2xl p-5">
                <div className="flex items-end gap-1.5 h-44">
                  {(() => {
                    const max = Math.max(...(data.songsByMonth?.map((m) => m.count) ?? [1]));
                    return data.songsByMonth?.map((m, i) => {
                      const h = max > 0 ? (m.count / max) * 100 : 0;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">{m.count}</span>
                          <div className="w-full rounded-t-md transition-all duration-500" style={{
                            height: `${Math.max(h, 4)}%`,
                            background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                            boxShadow: `0 0 8px ${CHART_COLORS[i % CHART_COLORS.length]}44`,
                          }} />
                          <span className="text-[9px] text-gray-600 mt-1 -rotate-45 origin-left whitespace-nowrap">{m.month.slice(5)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">🎯</span>
              <h2 className="section-title text-lg text-white">评分分布</h2>
            </div>
            {isLoading ? (
              <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ) : (
              <div className="neon-border rounded-2xl p-5">
                <ScoreDonut dist={data?.scoreDistribution ?? [0, 0, 0, 0, 0]} />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function EngCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="neon-border rounded-2xl p-4 text-center">
      <p className="text-xs text-gray-500 tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color, textShadow: `0 0 12px ${color}66` }}>{value}</p>
    </div>
  );
}
