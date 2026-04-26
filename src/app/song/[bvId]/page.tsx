'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';

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
          <div className="h-10 w-2/3 rounded bg-white/5 animate-pulse" />
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
    try {
      return JSON.parse(song.tags);
    } catch {
      return [];
    }
  })();

  const img = coverImgProps(song.picUrl);

  return (
    <main className="min-h-screen">
      {/* 返回导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--background))/80] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center">
          <a href="/" className="text-sm text-gray-500 hover:text-vocaloid-cyan transition-colors">
            &larr; 返回首页
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{song.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>{song.author}</span>
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
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 封面 */}
        {img.src && (
          <div className="rounded-2xl overflow-hidden border border-white/5">
            <img
              {...img}
              alt={song.title}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* 数据面板 */}
        <div className="neon-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 tracking-wider mb-4">
            统计数据
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <DataItem label="播放" value={formatCount(stats.playCount ?? 0)} />
            <DataItem label="点赞" value={formatCount(stats.likes ?? 0)} />
            <DataItem label="投币" value={formatCount(stats.coins ?? 0)} />
            <DataItem label="收藏" value={formatCount(stats.favorites ?? 0)} />
            <DataItem label="分享" value={formatCount(stats.shares ?? 0)} />
            <DataItem label="评论" value={formatCount(stats.comments ?? 0)} />
          </div>
        </div>

        {/* 评分 */}
        <div className="neon-rank rounded-2xl p-6 text-center">
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-1">综合评分</p>
          <p className="stat-value text-5xl md:text-6xl font-black">{song.score.toFixed(1)}</p>
        </div>

        {/* 简介 */}
        {song.description && (
          <div className="neon-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 tracking-wider mb-3">简介</h2>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {song.description}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
