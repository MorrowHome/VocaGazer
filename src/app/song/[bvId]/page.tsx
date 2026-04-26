'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';

const STAT_COLORS: Record<string, { label: string; textClass: string; bgClass: string }> = {
  playCount:   { label: '播放', textClass: 'text-cyan-400',   bgClass: 'bg-cyan-500/10' },
  likes:       { label: '点赞', textClass: 'text-pink-400',   bgClass: 'bg-pink-500/10' },
  coins:       { label: '投币', textClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
  favorites:   { label: '收藏', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10' },
  shares:      { label: '分享', textClass: 'text-green-400',  bgClass: 'bg-green-500/10' },
  comments:    { label: '评论', textClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
};

export default function SongDetailPage() {
  const { bvId } = useParams<{ bvId: string }>();
  const { data: song, isLoading, error } = trpc.songs.getByBvId.useQuery(
    decodeURIComponent(bvId),
  );

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-4">
          <div className="h-6 w-20 rounded bg-white/5 animate-pulse" />
          <div className="h-10 w-2/3 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-white/5 animate-pulse" />
          <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <a href="/" className="text-vocaloid-cyan hover:underline text-sm">&larr; 返回首页</a>
          <p className="text-gray-500 mt-8">歌曲未找到或加载失败</p>
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
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-vocaloid-cyan transition-colors">
            &larr; 返回
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* ─── 标题区 ─── */}
        <div className="rgb-border">
          <div className="rgb-border-content space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{song.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="text-vocaloid-cyan font-medium">{song.author}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{new Date(song.publishTime).toLocaleDateString('zh-CN')}</span>
              {song.duration ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span>
                    {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                  </span>
                </>
              ) : null}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:border-vocaloid-cyan/30 hover:text-white transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* B站观看按钮 */}
            <a
              href={biliUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-btn mt-2 inline-flex"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.562 3.76v7.36c-.038 1.51-.558 2.765-1.562 3.761s-2.263 1.52-3.773 1.574H5.333c-1.51-.054-2.769-.578-3.773-1.574C.556 20.112.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.562-3.76 1.004-.996 2.263-1.52 3.773-1.574h.773l-1.334-1.6a.96.96 0 0 1-.16-.907.914.914 0 0 1 .623-.533c.249-.071.507-.053.742.053a.96.96 0 0 1 .437.374L8.96 4.653h6.08l1.334-1.6a.96.96 0 0 1 .437-.374.872.872 0 0 1 .742-.053c.25.071.457.23.624.533a.96.96 0 0 1-.16.907l-1.204 1.587zM5.333 16.68c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64zm13.334 0c.582 0 1.082-.213 1.5-.64.418-.426.628-.939.628-1.533 0-.595-.21-1.097-.628-1.514-.418-.417-.918-.632-1.5-.64-.582.008-1.082.223-1.5.64-.418.417-.628.919-.628 1.514 0 .594.21 1.097.628 1.533.418.427.918.64 1.5.64z"/>
              </svg>
              在B站观看
              <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ─── 封面 ─── */}
        {img.src && (
          <div className="rounded-2xl overflow-hidden border border-white/5 relative group">
            <img
              {...img}
              alt={song.title}
              className="w-full max-h-96 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--background))] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-bold text-white/80 tracking-wider">♪ NOW PLAYING</span>
            </div>
          </div>
        )}

        {/* ─── 数据面板 ─── */}
        <div className="rgb-border">
          <div className="rgb-border-content">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📊</span>
              <h2 className="text-sm font-semibold text-gray-400 tracking-wider">
                统计数据
              </h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(STAT_COLORS).map(([key, cfg]) => {
                const val = stats[key] ?? 0;
                return (
                  <div key={key} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className={`text-lg md:text-xl font-black ${cfg.textClass}`}>
                      {formatCount(val)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 评分 ─── */}
        <div className="neon-rank rounded-2xl p-8 text-center relative overflow-hidden">
          {/* 装饰光效 */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-vocaloid-pink/5 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-vocaloid-cyan/5 blur-3xl" />
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-2">综合评分</p>
          <p className="text-5xl md:text-7xl font-black text-gradient-flow">
            {song.score.toFixed(1)}
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-lg ${star <= Math.round(song.score / 20) ? 'text-yellow-400' : 'text-gray-700'}`}>
                ★
              </span>
            ))}
          </div>
        </div>

        {/* ─── 简介 ─── */}
        {song.description && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💬</span>
              <h2 className="text-sm font-semibold text-gray-400 tracking-wider">简介</h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {song.description}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
