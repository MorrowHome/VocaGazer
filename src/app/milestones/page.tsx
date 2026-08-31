'use client';

import { trpc } from '@/lib/trpc';
import { timeAgo } from '@/lib/utils';

const MILESTONE_LABELS: Record<number, { label: string; symbol: string; color: string }> = {
  100000:    { label: '10 万', symbol: '★', color: '#39BEB9' },
  1000000:   { label: '100 万', symbol: '◆', color: '#B388FF' },
  10000000:  { label: '1000 万', symbol: '◈', color: '#FF6B9D' },
};

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const pct = Math.min(progress * 100, 100);
  return (
    <div className="w-16 md:w-24 h-1.5 rounded-full bg-kawaii-border/30 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function MilestonesPage() {
  const { data: milestones, isLoading } = trpc.milestones.getAll.useQuery();
  const { data: approaching } = trpc.milestones.getApproaching.useQuery();

  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">

        {/* ─── 接近中的歌曲 ─── */}
        {approaching && approaching.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-kawaii-cyan" aria-hidden="true">◈</span>
              <h2 className="text-sm font-black text-kawaii-muted tracking-wider uppercase">
                接近中
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-kawaii-surface text-kawaii-muted">
                  {approaching.length}
                </span>
              </h2>
            </div>
            <div className="space-y-1.5">
              {approaching.map((a) => {
                const info = MILESTONE_LABELS[a.threshold] || { label: `${a.threshold.toLocaleString()}`, symbol: '★', color: '#FFB08C' };
                const pct = Math.round(a.progress * 100);
                return (
                  <a
                    key={`${a.song.id}-${a.threshold}`}
                    href={`/song/${a.song.bvId}`}
                    className="card flex items-center gap-3 p-3 hover:border-kawaii-cyan/30 transition-all group"
                  >
                    <span className="text-sm shrink-0 text-kawaii-muted/40" aria-hidden="true">{info.symbol}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-kawaii-text truncate group-hover:text-kawaii-cyan transition-colors">
                        {a.song.title}
                      </p>
                      <p className="text-[11px] text-kawaii-muted font-medium">{a.song.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar progress={a.progress} color={info.color} />
                      <span className="text-xs font-black shrink-0" style={{ color: info.color }}>{pct}%</span>
                      <span className="text-[10px] text-kawaii-muted font-medium">{info.label}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 已达成 ─── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-kawaii-yellow" aria-hidden="true">★</span>
            <h2 className="text-sm font-black text-kawaii-muted tracking-wider uppercase">
              已达成
              {milestones && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-kawaii-surface text-kawaii-muted">{milestones.length}</span>}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : !milestones?.length ? (
            <div className="card p-12 text-center">
              <p className="text-lg mb-2 text-kawaii-muted" aria-hidden="true">★</p>
              <p className="text-sm text-kawaii-muted font-medium">暂无里程碑数据</p>
              <p className="text-xs text-kawaii-muted/60 mt-2 font-medium">歌曲播放量达到 10 万、100 万时自动记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => {
                const info = MILESTONE_LABELS[m.threshold] || { label: `${m.threshold.toLocaleString()}`, symbol: '★', color: '#FFB08C' };
                return (
                  <a
                    key={m.id}
                    href={`/song/${m.song.bvId}`}
                    className="card flex items-center gap-4 p-4 hover:border-kawaii-pink/30 transition-all group"
                  >
                    <span
                      className="text-2xl shrink-0 transition-transform group-hover:scale-125"
                      style={{ color: info.color }}
                      aria-hidden="true"
                    >
                      {info.symbol}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-kawaii-text truncate group-hover:text-kawaii-pink transition-colors">
                        {m.song.title}
                      </p>
                      <p className="text-[11px] text-kawaii-muted font-medium">{m.song.author}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: info.color }}>
                        {info.label}
                      </p>
                      <p className="text-[10px] text-kawaii-muted font-medium">
                        {(m as { isEstimated?: boolean }).isEstimated ? '补记 · ' : ''}
                        {timeAgo(m.achievedAt)}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
