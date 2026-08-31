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
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = trpc.songs.getDailyHistory.useQuery({ bvId }, { enabled: historyOpen });
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
          {chartMode === 'rates'
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
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          {radar.data ? (
            <ScoreRadar
              mode={chartMode === 'rates' ? 'rates' : 'counts'}
              song={chartMode === 'rates' ? radar.data.rates.normalized : radar.data.normalized}
              baseline={chartMode === 'rates' ? radar.data.rates.baseline : radar.data.baseline}
              raw={chartMode === 'rates' ? radar.data.rates.raw : radar.data.raw}
              baselineRaw={chartMode === 'rates' ? radar.data.rates.baselineRaw : radar.data.baselineRaw}
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
                  <button type="button" className="w-full text-left" onClick={() => setHistoryOpen(true)}>
                    <LineChart
                      data={series.map((d) => ({ date: d.date, value: d.playCount, missing: d.missing }))}
                      height={180}
                      color="#39C5BB"
                      gradientId="totalGrad"
                      maxValue={maxPlay}
                      formatter={(v) => `${(v / 10000).toFixed(1)}万`}
                      label="累计播放 · 点开看全部"
                      gaps
                    />
                  </button>
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

      {historyOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="card !p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-kawaii-text">全部播放历史</h3>
              <button type="button" className="text-xs text-kawaii-muted hover:text-kawaii-pink" onClick={() => setHistoryOpen(false)}>
                关闭
              </button>
            </div>
            {!history.data ? (
              <p className="text-sm text-kawaii-muted">加载中…</p>
            ) : history.data.length < 2 ? (
              <p className="text-sm text-kawaii-muted">还没有足够的日快照。</p>
            ) : (
              <>
                <LineChart
                  data={fillDailyGaps(history.data).map((d) => ({ date: d.date, value: d.playCount, missing: d.missing }))}
                  height={220}
                  color="#39C5BB"
                  gradientId="historyGrad"
                  maxValue={Math.max(...history.data.map((d) => d.playCount), 1)}
                  formatter={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString())}
                  label={`${history.data.length} 个快照`}
                  gaps
                />
                <div className="mt-4 space-y-1 max-h-56 overflow-y-auto">
                  {[...history.data].reverse().map((row, i, arr) => {
                    const prev = arr[i + 1];
                    const delta = prev ? row.playCount - prev.playCount : row.playCount;
                    const key = new Date(row.date).toISOString().slice(0, 10);
                    return (
                      <div key={key} className="flex justify-between text-[11px] font-medium text-kawaii-muted">
                        <span>{key}</span>
                        <span className="tabular-nums text-kawaii-text">
                          {row.playCount.toLocaleString()}
                          <span className="text-kawaii-cyan ml-2">+{Math.max(0, delta).toLocaleString()}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
