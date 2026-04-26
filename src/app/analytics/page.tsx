'use client';

import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

// ─── 横向柱状条 ───
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-gray-400 w-20 text-right truncate shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}44` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-12 shrink-0 text-right font-mono">{value}</span>
    </div>
  );
}

// ─── 评分分布饼图（CSS 环形） ───
function ScoreDonut({ dist }: { dist: number[] }) {
  const labels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const colors = ['#EF4444', '#F97316', '#FBBF24', '#22D3EE', '#A855F7'];
  const total = dist.reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-gray-600 text-sm">暂无数据</p>;

  // 用 CSS conic-gradient 画环形图
  let cumulative = 0;
  const stops = dist.map((val, i) => {
    const pct = (val / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return `${colors[i]} ${start}% ${cumulative}%`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${stops.join(', ')})`,
          boxShadow: '0 0 20px rgba(255,255,255,0.05)',
        }}
      />
      <div className="space-y-1.5">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-500 font-mono">{dist[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 页面 ───
export default function AnalyticsPage() {
  const { data, isLoading } = trpc.analytics.getAnalytics.useQuery();

  const maxTagCount = Math.max(...(data?.topTags.map((t) => t.count) ?? [1]));
  const maxArtistPlays = Math.max(...(data?.topArtists.map((a) => a.totalPlays) ?? [1]));
  const maxMonthCount = Math.max(...(data?.songsByMonth.map((m) => m.count) ?? [1]));

  const CHART_COLORS = [
    '#06B6D4', '#EC4899', '#A855F7', '#22D3EE', '#F97316',
    '#10B981', '#FBBF24', '#EF4444', '#8B5CF6', '#14B8A6',
  ];

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
        {/* 概览统计 */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">概览</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <OverviewCard label="歌曲总数" value={formatCount(data?.overview.totalSongs ?? 0)} />
              <OverviewCard label="UP主数" value={formatCount(data?.overview.totalArtists ?? 0)} />
              <OverviewCard label="总播放量" value={formatCount(data?.overview.totalPlayCount ?? 0)} />
              <OverviewCard label="平均评分" value={String(data?.overview.avgScore ?? 0)} />
            </div>
          )}
        </section>

        <div className="divider-cute" />

        <div className="grid md:grid-cols-2 gap-8">
          {/* 标签分布 */}
          <section>
            <h2 className="section-title text-lg text-white mb-6">
              <span className="text-lg">🏷</span> 标签分布
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-white/5 animate-pulse" />)}
              </div>
            ) : !data?.topTags?.length ? (
              <p className="text-gray-600 text-sm">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {data.topTags.slice(0, 12).map((tag, i) => (
                  <Bar
                    key={tag.name}
                    label={tag.name}
                    value={tag.count}
                    max={maxTagCount}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 热门UP主 */}
          <section>
            <h2 className="section-title text-lg text-white mb-6">
              <span className="text-lg">🎤</span> 热门 UP 主
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-white/5 animate-pulse" />)}
              </div>
            ) : !data?.topArtists?.length ? (
              <p className="text-gray-600 text-sm">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {data.topArtists.slice(0, 12).map((artist, i) => (
                  <Bar
                    key={artist.name}
                    label={artist.name}
                    value={artist.totalPlays}
                    max={maxArtistPlays}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="divider-cute" />

        {/* 月度发布趋势 */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">
            <span className="text-lg">📈</span> 月度发布趋势
          </h2>
          {isLoading ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : !data?.songsByMonth?.length ? (
            <p className="text-gray-600 text-sm">暂无数据</p>
          ) : (
            <div className="neon-border rounded-2xl p-6">
              <div className="flex items-end gap-1.5 h-48">
                {data.songsByMonth.map((m, i) => {
                  const h = maxMonthCount > 0 ? (m.count / maxMonthCount) * 100 : 0;
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {m.count}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80"
                        style={{
                          height: `${Math.max(h, 4)}%`,
                          background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                          boxShadow: `0 0 8px ${CHART_COLORS[i % CHART_COLORS.length]}44`,
                        }}
                      />
                      <span className="text-[9px] text-gray-600 mt-1 -rotate-45 origin-left whitespace-nowrap">
                        {m.month.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* 评分分布 */}
        <section>
          <h2 className="section-title text-lg text-white mb-6">
            <span className="text-lg">📊</span> 评分分布
          </h2>
          {isLoading ? (
            <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ) : (
            <div className="neon-border rounded-2xl p-6">
              <ScoreDonut dist={data?.scoreDistribution ?? [0, 0, 0, 0, 0]} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ─── 概览卡片 ───
function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rgb-card">
      <p className="stat-value text-2xl md:text-3xl">{value}</p>
      <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">{label}</p>
    </div>
  );
}
