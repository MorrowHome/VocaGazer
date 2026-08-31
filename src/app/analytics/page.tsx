'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';
import { Sparkline } from '@/components/charts/Sparkline';

type Range = '7d' | '30d' | '90d' | 'all';
const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '近 7 天' },
  { key: '30d', label: '近 30 天' },
  { key: '90d', label: '近 90 天' },
  { key: 'all', label: '全部' },
];

const CHART_COLORS = [
  '#FF8BB8', '#39C5BB', '#B8A0FF', '#E4C56A', '#FF9B7A',
  '#A8D14B', '#FF9EB5', '#7EC8E3', '#DCC8FF', '#80DEEA',
];

// ─── 概览卡片 ───
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rgb-card">
      <p className="stat-value">{value}</p>
      <p className="text-xs text-kawaii-muted mt-0.5 tracking-wider font-medium">{label}</p>
      {sub && <p className="text-[10px] text-kawaii-muted/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── 横向柱状条 ───
function Bar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-kawaii-muted w-22 text-right truncate shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-kawaii-surface overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-kawaii-muted w-16 shrink-0 text-right font-bold">{value}{suffix ?? ''}</span>
    </div>
  );
}

// ─── 评分分布环形图 ───
function ScoreDonut({ dist }: { dist: number[] }) {
  const labels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const colors = ['#FF9B7A', '#E4C56A', '#7DDBA3', '#39C5BB', '#B8A0FF'];
  const total = dist.reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-kawaii-muted text-sm font-medium">暂无数据</p>;

  let c = 0;
  const stops = dist.map((v, i) => {
    const p = (v / total) * 100;
    const s = c;
    c += p;
    return `${colors[i]} ${s}% ${c}%`;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="w-28 h-28 rounded-full shrink-0" style={{ background: `conic-gradient(${stops.join(', ')})`, boxShadow: '0 0 12px rgba(0,0,0,0.04)' }} />
      <div className="space-y-1.5">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-kawaii-muted w-12 font-medium">{l}</span>
            <span className="text-kawaii-text font-bold">{dist[i]}</span>
            <span className="text-kawaii-muted/60 text-[10px]">{total > 0 ? ((dist[i] / total) * 100).toFixed(1) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 表格行 ───
function TableRow({ rank, song }: { rank: number; song: any }) {
  return (
    <a
      href={`/song/${song.bvId}`}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-kawaii-surface transition-colors group"
    >
      <span className="text-xs text-kawaii-muted w-6 text-right font-bold">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">{song.title}</p>
        <p className="text-[11px] text-kawaii-muted truncate">{song.author}</p>
      </div>
      <span className="text-xs text-kawaii-muted w-16 text-right font-bold">{formatCount(song.plays ?? 0)}</span>
      <span className="text-xs text-kawaii-muted w-12 text-right font-bold">{formatCount(song.likes ?? 0)}</span>
      <span className="text-xs font-black w-14 text-right" style={{ color: song.score >= 60 ? '#39C5BB' : song.score >= 30 ? '#E4C56A' : '#FF8BB8' }}>
        {song.score.toFixed(1)}
      </span>
    </a>
  );
}

// ─── 页面 ───
export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');
  const { data, isLoading } = trpc.analytics.getAnalytics.useQuery({ range });

  const o = data?.overview;
  const e = data?.engagement;
  const maxTagCount = Math.max(...(data?.topTags.map((t) => t.count) ?? [1]));
  const maxArtistPlays = Math.max(...(data?.topArtists.map((a) => a.totalPlays) ?? [1]));

  return (
    <main className="min-h-screen relative">


      <div className="site-shell py-8 space-y-10 relative z-10">
        {/* ── 时间范围选择器 ── */}
        <div className="flex gap-2 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                range === r.key
                  ? 'bg-kawaii-pink text-white shadow-md'
                  : 'bg-kawaii-surface/80 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* ── 概览 ── */}
        <section>
          <h2 className="section-title text-kawaii-text mb-5">概览</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-kawaii-surface/50 animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              <StatCard label="歌曲总数" value={formatCount(o?.totalSongs ?? 0)} />
              <StatCard label="UP 主数" value={formatCount(o?.totalArtists ?? 0)} />
              <StatCard label="总播放" value={formatCount(o?.totalPlayCount ?? 0)} />
              <StatCard label="总点赞" value={formatCount(o?.totalLikeCount ?? 0)} />
              <StatCard label="总投币" value={formatCount(o?.totalCoinCount ?? 0)} />
              <StatCard label="总收藏" value={formatCount(o?.totalFavCount ?? 0)} />
              <StatCard label="平均评分" value={String(o?.avgScore ?? 0)} />
              <StatCard label="均播放/曲" value={formatCount(o?.avgPlaysPerSong ?? 0)} sub={`均赞 ${formatCount(o?.avgLikesPerSong ?? 0)}`} />
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* ── 互动率 ── */}
        <section>
          <h2 className="section-title text-kawaii-text mb-5">互动率</h2>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-kawaii-surface/50 animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <EngCard label="点赞率" value={`${e?.likePlayRatio ?? 0}%`} color="#FF8BB8" />
              <EngCard label="投币率" value={`${e?.coinPlayRatio ?? 0}%`} color="#E4C56A" />
              <EngCard label="收藏率" value={`${e?.favPlayRatio ?? 0}%`} color="#B388FF" />
              <EngCard label="分享率" value={`${e?.sharePlayRatio ?? 0}%`} color="#39C5BB" />
              <EngCard label="评论率" value={`${e?.commentPlayRatio ?? 0}%`} color="#FFB08C" />
            </div>
          )}
        </section>

        <div className="divider-cute" />

        {/* ── 标签 + UP主 柱状图 ── */}
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="section-title text-kawaii-text mb-5">标签分布</h2>
            {isLoading ? (
              <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-kawaii-surface/50 animate-pulse" />)}</div>
            ) : !data?.topTags?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
              <div className="space-y-2">{data.topTags.slice(0, 15).map((t, i) => (
                <Bar key={t.name} label={t.name} value={t.count} max={maxTagCount} color={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}</div>
            )}
          </section>

          <section>
            <h2 className="section-title text-kawaii-text mb-5">热门 UP 主</h2>
            {isLoading ? (
              <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-5 rounded-full bg-kawaii-surface/50 animate-pulse" />)}</div>
            ) : !data?.topArtists?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
              <div className="space-y-2">{data.topArtists.slice(0, 15).map((a, i) => (
                <Bar key={a.name} label={a.name} value={a.totalPlays} max={maxArtistPlays} color={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}</div>
            )}
          </section>
        </div>

        <div className="divider-cute" />

        {/* ── 高评分 UP 主 ── */}
        <section>
          <h2 className="section-title text-kawaii-text mb-5">高评分 UP 主（≥2首歌）</h2>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-kawaii-surface/50 animate-pulse" />)}</div>
          ) : !data?.topRatedArtists?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.topRatedArtists.map((a, i) => (
                <div key={a.name} className="card p-4 text-center">
                  <p className="text-xs text-kawaii-muted mb-1 font-bold">#{i + 1}</p>
                  <p className="text-base font-black text-kawaii-text truncate">{a.name}</p>
                  <p className={`text-2xl font-black mt-1 ${
                    i === 0 ? 'text-kawaii-pink' : i === 1 ? 'text-kawaii-cyan' : i === 2 ? 'text-kawaii-purple' : 'text-kawaii-text/60'
                  }`}>
                    {a.avgScore}
                  </p>
                  <p className="text-[10px] text-kawaii-muted mt-0.5 font-medium">{a.count} 首</p>
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
              <span className="text-lg text-kawaii-cyan" aria-hidden="true">◆</span>
              <h2 className="section-title text-kawaii-text">评分排行</h2>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-kawaii-surface/50 animate-pulse" />)}</div>
            ) : !data?.topSongs?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
              <div className="card overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-kawaii-border/50 text-[10px] text-kawaii-muted font-bold tracking-wider">
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
              <span className="text-lg text-kawaii-pink" aria-hidden="true">▶</span>
              <h2 className="section-title text-kawaii-text">播放排行</h2>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-kawaii-surface/50 animate-pulse" />)}</div>
            ) : !data?.mostPlayed?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
              <div className="card overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-kawaii-border/50 text-[10px] text-kawaii-muted font-bold tracking-wider">
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
              <span className="text-lg text-kawaii-purple" aria-hidden="true">◈</span>
              <h2 className="section-title text-kawaii-text">发布趋势</h2>
            </div>
            {isLoading ? (
              <div className="h-40 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
            ) : !data?.songsByMonth?.length ? <p className="text-kawaii-muted text-sm font-medium">暂无数据</p> : (
              <div className="card p-5">
                <Sparkline values={data.songsByMonth.map((m) => m.count)} color="#B388FF" className="w-full h-32 mb-3" />
                <div className="flex items-end gap-1.5 h-28">
                  {(() => {
                    const max = Math.max(...(data.songsByMonth?.map((m) => m.count) ?? [1]));
                    return data.songsByMonth?.map((m, i) => {
                      const h = max > 0 ? (m.count / max) * 100 : 0;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] text-kawaii-muted opacity-0 group-hover:opacity-100 transition-opacity font-bold">{m.count}</span>
                          <div className="w-full rounded-t-md transition-all duration-500" style={{
                            height: `${Math.max(h, 4)}%`,
                            background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                            borderRadius: '4px 4px 0 0',
                          }} />
                          <span className="text-[9px] text-kawaii-muted mt-1 -rotate-45 origin-left whitespace-nowrap font-medium">{m.month.slice(5)}</span>
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
              <span className="text-lg text-kawaii-yellow" aria-hidden="true">◆</span>
              <h2 className="section-title text-kawaii-text">评分分布</h2>
            </div>
            {isLoading ? (
              <div className="h-40 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
            ) : (
              <div className="card p-5">
                <ScoreDonut dist={data?.scoreDistribution ?? [0, 0, 0, 0, 0]} />
              </div>
            )}
          </section>
        </div>

        <div className="divider-cute" />

        {/* ── AI 分析报告 ── */}
        <AiReportsSection />

      </div>
    </main>
  );
}

function EngCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-kawaii-muted tracking-wider mb-1 font-bold">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

// ─── AI 晚报 ───
function AiReportsSection() {
  const { data: bundle, isLoading } = trpc.ai.getLatestBundle.useQuery();
  const { data: config } = trpc.ai.getConfig.useQuery();

  const cards = [
    { key: 'daily', title: '晚报', report: bundle?.daily },
    { key: 'trend', title: '趋势', report: bundle?.trend },
    { key: 'anomaly', title: '异常', report: bundle?.anomaly },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span aria-hidden="true" className="text-kawaii-purple text-lg">✦</span>
        <h2 className="section-title text-kawaii-text">AI 观察</h2>
        <span className="text-[10px] text-kawaii-muted bg-kawaii-surface/80 px-2.5 py-1 rounded-full border border-kawaii-border/50 font-medium">
          每日 20:00 更新
        </span>
        {config?.configured === false && (
          <span className="text-[10px] text-kawaii-muted bg-kawaii-surface/80 px-2.5 py-1 rounded-full border border-kawaii-border/50">
            降级模式
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 h-40 animate-pulse bg-kawaii-surface/50" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.key} className="card p-5">
              <p className="text-[10px] font-bold text-kawaii-muted tracking-wider uppercase mb-2">{c.title}</p>
              {c.report ? (
                <>
                  <h3 className="text-sm font-black text-kawaii-text mb-2">{c.report.title}</h3>
                  <p className="text-xs text-kawaii-text/70 font-medium leading-relaxed whitespace-pre-wrap">
                    {c.report.content}
                  </p>
                </>
              ) : (
                <p className="text-sm text-kawaii-muted font-medium">尚无报告，等到 20:00 或在管理台手动生成</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
