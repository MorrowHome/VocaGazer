'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';

const STAT_COLORS: Record<string, { label: string; color: string }> = {
  playCount:   { label: '播放', color: '#39BEB9' },
  likes:       { label: '点赞', color: '#FF6B9D' },
  coins:       { label: '投币', color: '#F7C94C' },
  favorites:   { label: '收藏', color: '#B388FF' },
  shares:      { label: '分享', color: '#A8D14B' },
  comments:    { label: '评论', color: '#FFB08C' },
};

// ─── 热评组件 ───

function CommentSection({ bvId }: { bvId: string }) {
  const { data: hot, isLoading } = trpc.comments.getTop.useQuery(
    decodeURIComponent(bvId),
  );

  if (isLoading) {
    return (
      <div className="card !p-6 animate-pulse">
        <div className="h-4 w-20 rounded bg-white/60 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!hot || hot.comments.length === 0) return null;

  return (
    <div className="card !p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg text-kawaii-orange" aria-hidden="true">♪</span>
        <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">热评</h2>
        {hot.total > 3 && (
          <span className="text-[10px] text-kawaii-muted font-medium ml-auto">
            共 {hot.total} 条评论
          </span>
        )}
      </div>
      <div className="space-y-3">
        {hot.comments.map((c, i) => (
          <div
            key={c.rpid}
            className="flex gap-3 p-3 rounded-xl bg-white/70 border border-kawaii-border/30"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-kawaii-surface ring-1 ring-kawaii-border/30">
              {c.avatar ? (
                <img src={c.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-kawaii-muted">♪</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-kawaii-text truncate">{c.uname}</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-kawaii-pink shrink-0">
                  <span aria-hidden="true">♥</span>
                  {c.likes}
                </span>
                {i === 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-kawaii-pink/10 text-kawaii-pink shrink-0 border border-kawaii-pink/20">
                    TOP 1
                  </span>
                )}
              </div>
              <p className="text-sm text-kawaii-text/80 leading-relaxed line-clamp-3">
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 播放趋势图 ───

function TrendChart({ dailyStats }: { dailyStats: Array<{ date: string; playCount: number }> }) {
  const sorted = [...dailyStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 计算每日增量
  const deltas = sorted.map((d, i) => {
    const prev = i > 0 ? sorted[i - 1].playCount : d.playCount;
    return { date: d.date, delta: d.playCount - prev, total: d.playCount };
  });

  const maxDelta = Math.max(...deltas.map((d) => d.delta), 1);
  const maxTotal = Math.max(...deltas.map((d) => d.total), 1);

  return (
    <div className="card !p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg text-kawaii-cyan" aria-hidden="true">◈</span>
        <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">播放趋势</h2>
        <span className="text-[10px] text-kawaii-muted font-medium ml-auto">
          {sorted.length} 天
        </span>
      </div>

      {/* 累计播放曲线（柱状） */}
      <div className="mb-4">
        <p className="text-[10px] text-kawaii-muted font-bold mb-2">累计播放</p>
        <div className="flex items-end gap-[2px] h-24 overflow-x-auto pb-1">
          {deltas.map((d) => (
            <div
              key={d.date}
              className="flex-1 min-w-[8px] rounded-t-sm transition-all hover:opacity-80"
              style={{
                height: `${(d.total / maxTotal) * 100}%`,
                background: 'linear-gradient(to top, #39BEB9, #7EDDD9)',
              }}
              title={`${d.date.slice(5)}: ${(d.total / 10000).toFixed(1)}万`}
            />
          ))}
        </div>
      </div>

      {/* 每日增量（柱状） */}
      <div>
        <p className="text-[10px] text-kawaii-muted font-bold mb-2">单日增量</p>
        <div className="flex items-end gap-[2px] h-16 overflow-x-auto pb-1">
          {deltas.map((d) => (
            <div
              key={d.date}
              className="flex-1 min-w-[8px] rounded-t-sm transition-all hover:opacity-80"
              style={{
                height: `${(d.delta / maxDelta) * 100}%`,
                background: d.delta > 0
                  ? 'linear-gradient(to top, #B388FF, #D4B8FF)'
                  : '#E8E0F0',
              }}
              title={`${d.date.slice(5)}: +${d.delta.toLocaleString()}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SongDetailPage() {
  const { bvId } = useParams<{ bvId: string }>();
  const { data: song, isLoading, error } = trpc.songs.getByBvId.useQuery(
    decodeURIComponent(bvId),
  );
  const { data: milestones } = trpc.milestones.getBySong.useQuery(
    song?.id ?? '',
    { enabled: !!song },
  );

  if (isLoading) {
    return (
      <main className="min-h-screen relative">
        <BackgroundLayers />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-4 relative z-10">
          <div className="h-6 w-20 rounded-lg bg-white/60 animate-pulse" />
          <div className="h-10 w-2/3 rounded-xl bg-white/60 animate-pulse" />
          <div className="h-4 w-1/3 rounded-lg bg-white/60 animate-pulse" />
          <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="min-h-screen relative">
        <BackgroundLayers />
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 relative z-10">
          <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回首页</a>
          <p className="text-kawaii-muted font-medium mt-8">歌曲未找到或加载失败</p>
        </div>
      </main>
    );
  }

  const stats = parseStats(song.statistics);
  const tags: string[] = (() => {
    try { return JSON.parse(song.tags); } catch { return []; }
  })();

  const img = coverImgProps(song.picUrl);
  const biliUrl = `https://www.bilibili.com/video/${song.bvId}`;

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium flex items-center gap-2">
            &larr; 返回
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        {/* ─── 标题区 ─── */}
        <div className="card !p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" aria-hidden="true">♪</span>
              <span className="text-[10px] text-kawaii-muted font-bold tracking-wider uppercase">Track Information</span>
              <div className="flex-1 h-px bg-gradient-to-r from-kawaii-border/50 to-transparent" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-kawaii-text leading-tight">
              {song.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-kawaii-muted font-medium">
              <a
                href={`/author/${encodeURIComponent(song.author)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-pink font-black flex items-center gap-1 hover:text-kawaii-cyan transition-colors"
              >
                <span aria-hidden="true" className="text-lg">♪</span>
                {song.author}
              </a>
              <span className="w-1 h-1 rounded-full bg-kawaii-border" />
              <span>{new Date(song.publishTime).toLocaleDateString('zh-CN')}</span>
              {song.duration ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-kawaii-border" />
                  <span>{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</span>
                </>
              ) : null}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 12).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-bold px-3 py-1 rounded-full bg-kawaii-surface text-kawaii-muted border border-kawaii-border/30 hover:border-kawaii-pink/30 hover:text-kawaii-pink transition-all"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <a
              href={biliUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-pink inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.562 3.76v7.36c-.038 1.51-.558 2.765-1.562 3.761s-2.263 1.52-3.773 1.574H5.333c-1.51-.054-2.769-.578-3.773-1.574C.556 20.112.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.562-3.76 1.004-.996 2.263-1.52 3.773-1.574h.773l-1.334-1.6a.96.96 0 0 1-.16-.907.914.914 0 0 1 .623-.533c.249-.071.507-.053.742.053a.96.96 0 0 1 .437.374L8.96 4.653h6.08l1.334-1.6a.96.96 0 0 1 .437-.374.872.872 0 0 1 .742-.053c.25.071.457.23.624.533a.96.96 0 0 1-.16.907l-1.204 1.587zM5.333 16.68c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64zm13.334 0c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64z"/>
              </svg>
              在B站观看
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ─── 封面 ─── */}
        {img.src && (
          <div className="rounded-2xl overflow-hidden relative group ring-1 ring-kawaii-border/30">
            <img
              {...img}
              alt={song.title}
              className="w-full max-h-[28rem] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <span className="text-xs font-black text-kawaii-muted tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-kawaii-pink inline-block animate-pulse" />
                NOW PLAYING
              </span>
            </div>
          </div>
        )}

        {/* ─── 数据面板 ─── */}
        <div className="card !p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg text-kawaii-purple" aria-hidden="true">◈</span>
            <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">统计数据</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(STAT_COLORS).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              return (
                <div key={key} className="text-center p-4 rounded-xl bg-white/70 border border-kawaii-border/30 transition-all hover:scale-105 hover:border-kawaii-pink/20">
                  <p className="text-lg md:text-2xl font-black" style={{ color: cfg.color }}>
                    {formatCount(val)}
                  </p>
                  <p className="text-xs text-kawaii-muted font-medium mt-1">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 里程碑 ─── */}
        {milestones && milestones.length > 0 && (
          <div className="card !p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg text-kawaii-yellow" aria-hidden="true">★</span>
              <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">里程碑</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-kawaii-border/30"
                >
                  <span className="text-lg" aria-hidden="true">
                    {m.threshold >= 1000000 ? '◆' : '★'}
                  </span>
                  <div>
                    <p className="text-sm font-black text-kawaii-text">
                      {m.threshold >= 10000
                        ? `${(m.threshold / 10000).toFixed(0)} 万`
                        : m.threshold}{' '}
                      播放达成
                    </p>
                    <p className="text-[10px] text-kawaii-muted font-medium">
                      {new Date(m.achievedAt).toLocaleDateString('zh-CN')} · 精确值 {m.playCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 播放趋势 ─── */}
        {song && song.dailyStats && song.dailyStats.length > 2 && (
          <TrendChart dailyStats={song.dailyStats} />
        )}

        {/* ─── 热评 ─── */}
        {song && (
          <CommentSection bvId={bvId} />
        )}

        {/* ─── 综合评分 ─── */}
        <div className="card !p-8 text-center relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-kawaii-pink/5 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-kawaii-cyan/5 blur-3xl" />
          <div className="relative z-10">
            <p className="text-xs text-kawaii-muted font-bold tracking-wider uppercase mb-2">综合评分</p>
            <p className="text-5xl md:text-7xl font-black text-gradient-flow">
              {song.score.toFixed(1)}
            </p>
            <div className="flex justify-center gap-1.5 mt-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(song.score / 20);
                return (
                  <span
                    key={star}
                    className={`text-xl transition-all duration-300 ${
                      filled
                        ? 'text-kawaii-yellow drop-shadow-[0_0_6px_rgba(247,201,76,0.5)]'
                        : 'text-kawaii-border'
                    }`}
                  >
                    ★
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 简介 ─── */}
        {song.description && (
          <div className="card !p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg" aria-hidden="true">♪</span>
              <h2 className="text-xs font-black text-kawaii-muted tracking-wider uppercase">歌曲简介</h2>
            </div>
            <p className="text-sm text-kawaii-text/80 font-medium leading-relaxed whitespace-pre-wrap">
              {song.description}
            </p>
          </div>
        )}

        {/* ─── 底部 ─── */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex justify-center gap-3">
            <a href="/" className="btn btn-ghost !py-2 !px-6 text-sm">&larr; 返回首页</a>
            <a href="/ranking" className="btn btn-pink !py-2 !px-6 text-sm">◈ 排行榜</a>
          </div>
        </div>
      </div>
    </main>
  );
}
