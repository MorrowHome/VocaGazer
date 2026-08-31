'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ScoreRadar } from '@/components/charts/ScoreRadar';
import { LineChart } from '@/components/charts/LineChart';

function fillDailyGaps(
  rows: Array<{ date: string | Date; playCount: number; score: number }>,
) {
  if (rows.length === 0) return [];
  const byDay = new Map<string, { playCount: number; score: number }>();
  for (const r of rows) {
    const key = typeof r.date === 'string' ? r.date.slice(0, 10) : r.date.toISOString().slice(0, 10);
    byDay.set(key, { playCount: r.playCount, score: r.score });
  }
  const keys = Array.from(byDay.keys()).sort();
  const start = new Date(keys[0]);
  const end = new Date(keys[keys.length - 1]);
  const out: Array<{ date: string; playCount: number; score: number; missing: boolean }> = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({
      date: key,
      playCount: hit?.playCount ?? 0,
      score: hit?.score ?? 0,
      missing: !hit,
    });
  }
  return out;
}

export function SongPowerPanel({
  bvId,
  dailyStats,
}: {
  bvId: string;
  dailyStats: Array<{ date: string | Date; playCount: number; score: number }>;
}) {
  const [baseline, setBaseline] = useState<'weekly' | 'historical'>('weekly');
  const radar = trpc.analytics.getRadar.useQuery({ bvId, baseline });
  const series = fillDailyGaps(dailyStats);
  const present = series.filter((s) => !s.missing);
  const maxPlay = Math.max(...present.map((d) => d.playCount), 1);
  const deltas = series.map((d, i) => {
    const prev = series[i - 1];
    const delta = !d.missing && prev && !prev.missing ? d.playCount - prev.playCount : 0;
    return { date: d.date, value: Math.max(0, delta), missing: d.missing || !prev || prev.missing };
  });
  const maxDelta = Math.max(...deltas.filter((d) => !d.missing).map((d) => d.value), 1);

  return (
    <div className="card !p-6 space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg text-kawaii-pink" aria-hidden="true">◈</span>
        <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">实力 / 生涯</h2>
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
              {k === 'weekly' ? '本周均' : '历史均'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          {radar.data ? (
            <ScoreRadar song={radar.data.normalized} baseline={radar.data.baseline} />
          ) : (
            <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
          )}
          <p className="text-[10px] text-kawaii-muted text-center mt-2 font-medium">
            基底均值落在 50，像对照运动员能力。粉为本曲，青为对照。
          </p>
        </div>
        <div>
          {series.length < 2 ? (
            <p className="text-sm text-kawaii-muted font-medium">生涯数据待夜间刷新后出现</p>
          ) : (
            <>
              <p className="text-[10px] text-kawaii-muted font-medium mb-2">
                覆盖 {present.length} / {series.length} 天
                {radar.data?.latestSnapshotDate
                  ? ` · 最近快照 ${new Date(radar.data.latestSnapshotDate).toLocaleDateString('zh-CN')}`
                  : ''}
              </p>
              <LineChart
                data={series.map((d) => ({ date: d.date, value: d.playCount, missing: d.missing }))}
                height={180}
                color="#39BEB9"
                gradientId="totalGrad"
                maxValue={maxPlay}
                formatter={(v) => `${(v / 10000).toFixed(1)}万`}
                label="累计播放"
                gaps
              />
              <div className="mt-4">
                <LineChart
                  data={deltas}
                  height={140}
                  color="#B388FF"
                  gradientId="deltaGrad"
                  maxValue={maxDelta}
                  formatter={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toLocaleString())}
                  label="单日增量"
                  gaps
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SongRelated({ bvId }: { bvId: string }) {
  const { data } = trpc.songs.similar.useQuery({ bvId });
  if (!data) return null;
  const blocks = [
    { title: '同作者更多', items: data.sameAuthor },
    { title: '相似曲', items: data.similar },
  ];
  if (!data.sameAuthor.length && !data.similar.length) return null;
  return (
    <div className="card !p-6 space-y-5">
      {blocks.map((b) =>
        b.items.length === 0 ? null : (
          <div key={b.title}>
            <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase mb-3">{b.title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {b.items.map((s) => (
                <a
                  key={s.id}
                  href={`/song/${s.bvId}`}
                  className="rounded-xl px-3 py-2 bg-white/70 border border-kawaii-border/30 hover:border-kawaii-pink/30"
                >
                  <p className="text-sm font-bold text-kawaii-text truncate">{s.title}</p>
                  <p className="text-[11px] text-kawaii-muted truncate">{s.author} · {s.score.toFixed(1)}</p>
                </a>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
