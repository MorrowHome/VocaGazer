'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';
import { dailyDeltas, fillDailyGaps, rateOf, sliceRange, type DailySnap } from '@/lib/daily-series';
import { ScoreRadar } from '@/components/charts/ScoreRadar';
import { StockDeltaChart } from '@/components/charts/StockDeltaChart';
import { MetricTrendChart } from '@/components/charts/MetricTrendChart';

const STATS = [
  { key: 'playCount', label: '播放', color: '#39C5BB' },
  { key: 'likes', label: '点赞', color: '#FF8BB8' },
  { key: 'coins', label: '投币', color: '#E4C56A' },
  { key: 'favorites', label: '收藏', color: '#B8A0FF' },
  { key: 'shares', label: '分享', color: '#7DDBA3' },
  { key: 'comments', label: '评论', color: '#FF9B7A' },
] as const;

const COUNT_SERIES = STATS.filter((s) => s.key !== 'playCount').map((s) => ({
  key: s.key,
  label: s.label,
  color: s.color,
}));

const RATE_SERIES = [
  { key: 'likeRate', label: '点赞率', color: '#FF8BB8' },
  { key: 'coinRate', label: '投币率', color: '#E4C56A' },
  { key: 'favRate', label: '收藏率', color: '#B8A0FF' },
];

type Range = '7d' | '30d' | '90d' | 'all';

function fmtCount(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(v >= 100000 ? 1 : 2)}万`;
  if (v >= 1000) return v.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

function fmtScore(v: number) {
  return v.toFixed(1);
}

function Kpi({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-kawaii-border/40 bg-kawaii-surface/60 px-4 py-4">
      <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-kawaii-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl md:text-3xl font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
      {sub ? <p className="mt-2 text-[11px] font-medium text-kawaii-muted tabular-nums">{sub}</p> : null}
    </div>
  );
}

export function SongStatsDashboard({
  bvId,
  title,
  author,
  picUrl,
  score,
  statistics,
}: {
  bvId: string;
  title: string;
  author: string;
  picUrl?: string | null;
  score: number;
  statistics: string;
}) {
  const [range, setRange] = useState<Range>('30d');
  const [baseline, setBaseline] = useState<'weekly' | 'historical'>('weekly');
  const [radarMode, setRadarMode] = useState<'counts' | 'rates'>('counts');
  const history = trpc.songs.getDailyHistory.useQuery({ bvId });
  const radar = trpc.analytics.getRadar.useQuery({ bvId, baseline });
  const img = coverImgProps(picUrl);
  const totals = parseStats(statistics);

  const series = useMemo(() => fillDailyGaps((history.data ?? []) as DailySnap[]), [history.data]);
  const windowed = useMemo(() => sliceRange(series, range), [series, range]);
  const present = windowed.filter((s) => !s.missing);
  const last = present[present.length - 1];
  const prev = present.length >= 2 ? present[present.length - 2] : null;

  const playDeltas = useMemo(() => dailyDeltas(windowed, 'playCount'), [windowed]);
  const rateRows = useMemo(
    () =>
      windowed.map((d) => ({
        date: d.date,
        missing: d.missing,
        likeRate: rateOf(d.likes, d.playCount),
        coinRate: rateOf(d.coins, d.playCount),
        favRate: rateOf(d.favorites, d.playCount),
      })),
    [windowed],
  );

  const likeRate = rateOf(totals.likes ?? 0, totals.playCount ?? 0);
  const coinRate = rateOf(totals.coins ?? 0, totals.playCount ?? 0);
  const favRate = rateOf(totals.favorites ?? 0, totals.playCount ?? 0);
  const coinLike = rateOf(totals.coins ?? 0, totals.likes ?? 0);
  const playDelta = last && prev ? Math.max(0, last.playCount - prev.playCount) : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end gap-4">
        <a href={`/song/${bvId}`} className="relative h-16 w-28 overflow-hidden rounded-xl ring-1 ring-kawaii-border/50 shrink-0">
          {img.src ? (
            <img {...img} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <div className="h-full w-full bg-kawaii-surface" />
          )}
        </a>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-kawaii-pink">歌曲数据</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-kawaii-text truncate">{title}</h1>
          <p className="text-sm text-kawaii-muted font-medium">
            <a href={`/author/${encodeURIComponent(author)}`} className="hover:text-kawaii-pink">
              {author}
            </a>
            <span className="opacity-40 mx-2">·</span>
            综合分 {score.toFixed(1)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setRange(k)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                range === k ? 'bg-kawaii-pink text-white' : 'bg-kawaii-surface text-kawaii-muted'
              }`}
            >
              {k === 'all' ? '全部' : k === '7d' ? '7 天' : k === '30d' ? '30 天' : '90 天'}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STATS.map((s) => {
          const val = totals[s.key] ?? 0;
          const delta = last && prev ? Math.max(0, Number(last[s.key]) - Number(prev[s.key])) : 0;
          return (
            <Kpi
              key={s.key}
              label={s.label}
              value={formatCount(val)}
              sub={prev ? `较上一日 +${formatCount(delta)}` : undefined}
              color={s.color}
            />
          );
        })}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="点赞率" value={fmtPct(likeRate)} sub="点赞 / 播放" color="#FF8BB8" />
        <Kpi label="投币率" value={fmtPct(coinRate)} sub="投币 / 播放" color="#E4C56A" />
        <Kpi label="收藏率" value={fmtPct(favRate)} sub="收藏 / 播放" color="#B8A0FF" />
        <Kpi label="投币/赞" value={fmtPct(coinLike)} sub="点赞里有多少投了币" color="#39C5BB" />
      </section>

      <section className="card !p-5 md:!p-7 space-y-8">
        <div>
          <h2 className="section-title text-kawaii-text mb-1">播放</h2>
          <p className="text-[11px] text-kawaii-muted mb-5">累计曲线看体量，柱线看每天新增。十字光标可读当天数字。</p>
          {history.isLoading ? (
            <div className="h-64 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
          ) : (
            <div className="space-y-8">
              <MetricTrendChart
                label="累计播放"
                data={windowed}
                series={[{ key: 'playCount', label: '播放', color: '#39C5BB' }]}
                height={300}
                formatter={fmtCount}
                fill
              />
              <StockDeltaChart
                data={playDeltas}
                height={240}
                formatter={fmtCount}
                label={`单日增量${playDelta ? ` · 最近 +${fmtCount(playDelta)}` : ''}`}
              />
            </div>
          )}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card !p-5 md:!p-7">
          <h2 className="section-title text-kawaii-text mb-1">互动量</h2>
          <p className="text-[11px] text-kawaii-muted mb-5">点赞、投币、收藏、分享、评论的累计对照。点图例可隐藏。</p>
          {history.isLoading ? (
            <div className="h-64 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
          ) : (
            <MetricTrendChart data={windowed} series={COUNT_SERIES} height={300} formatter={fmtCount} />
          )}
        </div>
        <div className="card !p-5 md:!p-7">
          <h2 className="section-title text-kawaii-text mb-1">互动率</h2>
          <p className="text-[11px] text-kawaii-muted mb-5">相对播放的转化。推流灌水通常播放高、这三条线偏低。</p>
          {history.isLoading ? (
            <div className="h-64 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
          ) : (
            <MetricTrendChart data={rateRows} series={RATE_SERIES} height={300} formatter={fmtPct} />
          )}
        </div>
      </section>

      <section className="card !p-5 md:!p-7">
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <h2 className="section-title text-kawaii-text">相对图均</h2>
          <p className="text-[11px] text-kawaii-muted">
            {radarMode === 'rates'
              ? baseline === 'weekly'
                ? '对照全站本周互动率均值'
                : '对照全站累计互动率均值'
              : baseline === 'weekly'
                ? '对照全站本周增量均值'
                : '对照全站累计均值'}
          </p>
          <div className="ml-auto flex gap-1 flex-wrap">
            {(['weekly', 'historical'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setBaseline(k)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  baseline === k ? 'bg-kawaii-pink text-white' : 'bg-kawaii-surface text-kawaii-muted'
                }`}
              >
                {k === 'weekly' ? '本周增量' : '历史累计'}
              </button>
            ))}
            {(['counts', 'rates'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRadarMode(m)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  radarMode === m ? 'bg-kawaii-cyan/80 text-kawaii-void' : 'bg-kawaii-surface text-kawaii-muted'
                }`}
              >
                {m === 'counts' ? '绝对量' : '互动率'}
              </button>
            ))}
          </div>
        </div>
        {radar.data ? (
          <ScoreRadar
            mode={radarMode}
            song={radarMode === 'rates' ? radar.data.rates.normalized : radar.data.normalized}
            baseline={radarMode === 'rates' ? radar.data.rates.baseline : radar.data.baseline}
            raw={radarMode === 'rates' ? radar.data.rates.raw : radar.data.raw}
            baselineRaw={radarMode === 'rates' ? radar.data.rates.baselineRaw : radar.data.baselineRaw}
            className="max-w-[520px]"
          />
        ) : (
          <div className="h-72 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
        )}
      </section>

      <section className="card !p-5 md:!p-7">
        <h2 className="section-title text-kawaii-text mb-1">评分走势</h2>
        <p className="text-[11px] text-kawaii-muted mb-5">站点综合分随快照变化。算法见关于页。</p>
        {history.isLoading ? (
          <div className="h-48 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
        ) : (
          <MetricTrendChart
            data={windowed}
            series={[{ key: 'score', label: '评分', color: '#FF8BB8' }]}
            height={220}
            formatter={fmtScore}
            fill
          />
        )}
      </section>

      <section className="card !p-0 overflow-hidden">
        <div className="px-5 md:px-7 pt-6 pb-3 flex items-baseline justify-between gap-3">
          <h2 className="section-title text-kawaii-text">日快照</h2>
          <p className="text-[11px] text-kawaii-muted">{present.length} 天有数据</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] min-w-[720px]">
            <thead className="text-kawaii-muted font-bold">
              <tr className="border-y border-kawaii-border/40">
                <th className="px-5 md:px-7 py-2.5 font-bold">日期</th>
                <th className="px-3 py-2.5 font-bold text-right">播放</th>
                <th className="px-3 py-2.5 font-bold text-right">+播</th>
                <th className="px-3 py-2.5 font-bold text-right">点赞</th>
                <th className="px-3 py-2.5 font-bold text-right">投币</th>
                <th className="px-3 py-2.5 font-bold text-right">收藏</th>
                <th className="px-3 py-2.5 font-bold text-right">赞率</th>
                <th className="px-5 md:px-7 py-2.5 font-bold text-right">评分</th>
              </tr>
            </thead>
            <tbody>
              {[...present].reverse().slice(0, range === 'all' ? 400 : 90).map((row, i, arr) => {
                const older = arr[i + 1];
                const delta = older ? Math.max(0, row.playCount - older.playCount) : row.playCount;
                return (
                  <tr key={row.date} className="border-b border-kawaii-border/25 hover:bg-kawaii-surface/40">
                    <td className="px-5 md:px-7 py-2 tabular-nums text-kawaii-muted">{row.date}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-kawaii-text">{row.playCount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-kawaii-cyan">+{delta.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.likes.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.coins.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.favorites.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-kawaii-pink">{fmtPct(rateOf(row.likes, row.playCount))}</td>
                    <td className="px-5 md:px-7 py-2 text-right tabular-nums font-bold">{row.score.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
