'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ScoreRadar } from '@/components/charts/ScoreRadar';
import { LineChart } from '@/components/charts/LineChart';
import { StockDeltaChart } from '@/components/charts/StockDeltaChart';
import { RateCompareChart } from '@/components/charts/RateCompareChart';

type DailyRow = {
  date: string | Date;
  playCount: number;
  likes?: number;
  coins?: number;
  favorites?: number;
  score: number;
};

function fillDailyGaps(rows: DailyRow[]) {
  if (rows.length === 0) return [];
  const byDay = new Map<string, { playCount: number; likes: number; coins: number; favorites: number; score: number }>();
  for (const r of rows) {
    const key = typeof r.date === 'string' ? r.date.slice(0, 10) : r.date.toISOString().slice(0, 10);
    byDay.set(key, {
      playCount: r.playCount,
      likes: r.likes ?? 0,
      coins: r.coins ?? 0,
      favorites: r.favorites ?? 0,
      score: r.score,
    });
  }
  const keys = Array.from(byDay.keys()).sort();
  const start = new Date(keys[0]);
  const end = new Date(keys[keys.length - 1]);
  const out: Array<{
    date: string;
    playCount: number;
    likes: number;
    coins: number;
    favorites: number;
    score: number;
    missing: boolean;
  }> = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({
      date: key,
      playCount: hit?.playCount ?? 0,
      likes: hit?.likes ?? 0,
      coins: hit?.coins ?? 0,
      favorites: hit?.favorites ?? 0,
      score: hit?.score ?? 0,
      missing: !hit,
    });
  }
  return out;
}

function rate(num: number, den: number) {
  if (den <= 0) return 0;
  return num / den;
}

export function SongPowerPanel({
  bvId,
  dailyStats,
}: {
  bvId: string;
  dailyStats: DailyRow[];
}) {
  const [baseline, setBaseline] = useState<'weekly' | 'historical'>('weekly');
  const [chartMode, setChartMode] = useState<'plays' | 'rates'>('plays');
  const radar = trpc.analytics.getRadar.useQuery({ bvId, baseline });
  const series = fillDailyGaps(dailyStats);
  const present = series.filter((s) => !s.missing);
  const maxPlay = Math.max(...present.map((d) => d.playCount), 1);
  const deltas = series.map((d, i) => {
    const prev = series[i - 1];
    const delta = !d.missing && prev && !prev.missing ? d.playCount - prev.playCount : 0;
    return { date: d.date, value: Math.max(0, delta), missing: d.missing || !prev || prev.missing };
  });

  return (
    <div className="card !p-6 space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">相对图均</h2>
        <p className="text-[10px] text-kawaii-muted">
          {baseline === 'weekly' ? '对照全站本周增量均值' : '对照全站累计均值'}
        </p>
        <div className="ml-auto flex gap-1">
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
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          {radar.data ? (
            <ScoreRadar
              song={radar.data.normalized}
              baseline={radar.data.baseline}
              raw={radar.data.raw}
              baselineRaw={radar.data.baselineRaw}
            />
          ) : (
            <div className="h-48 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
          )}
        </div>
        <div>
          {series.length < 2 ? (
            <p className="text-sm text-kawaii-muted font-medium">暂无日数据</p>
          ) : (
            <>
              <p className="text-[10px] text-kawaii-muted font-medium mb-2 flex items-center gap-2 flex-wrap">
                <span>
                  {present.length} 天
                  {radar.data?.latestSnapshotDate
                    ? ` · ${new Date(radar.data.latestSnapshotDate).toLocaleDateString('zh-CN')}`
                    : ''}
                  {baseline === 'weekly' && radar.data?.compareMode === 'lifetime' ? ' · 本周尚无增量，暂用累计' : ''}
                </span>
                <span className="ml-auto flex gap-1">
                  {(['plays', 'rates'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartMode(m)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        chartMode === m ? 'bg-kawaii-cyan/80 text-kawaii-void' : 'bg-kawaii-surface text-kawaii-muted'
                      }`}
                    >
                      {m === 'plays' ? '播放' : '互动率'}
                    </button>
                  ))}
                </span>
              </p>
              {chartMode === 'rates' ? (
                <RateCompareChart
                  data={series.map((d) => ({
                    date: d.date,
                    missing: d.missing,
                    likeRate: rate(d.likes, d.playCount),
                    coinRate: rate(d.coins, d.playCount),
                    favRate: rate(d.favorites, d.playCount),
                  }))}
                  height={328}
                />
              ) : (
                <>
                  <LineChart
                    data={series.map((d) => ({ date: d.date, value: d.playCount, missing: d.missing }))}
                    height={180}
                    color="#39C5BB"
                    gradientId="totalGrad"
                    maxValue={maxPlay}
                    formatter={(v) => `${(v / 10000).toFixed(1)}万`}
                    label="累计播放"
                    gaps
                  />
                  <div className="mt-4">
                    <StockDeltaChart
                      data={deltas}
                      height={148}
                      formatter={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString())}
                      label="单日增量"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
