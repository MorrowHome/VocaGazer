'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { formatCount, parseStats, coverImgProps } from '@/lib/utils';
import { useAuth } from '@/components/AuthContext';
import { useState } from 'react';
import { Sparkline } from '@/components/charts/Sparkline';
import { AdminDeleteSongButton } from '@/components/AdminDeleteSongButton';

const STAT_COLORS: Record<string, { label: string; color: string }> = {
  playCount:   { label: '播放', color: '#39C5BB' },
  likes:       { label: '点赞', color: '#FF8BB8' },
  coins:       { label: '投币', color: '#E4C56A' },
  favorites:   { label: '收藏', color: '#B8A0FF' },
  shares:      { label: '分享', color: '#7DDBA3' },
  comments:    { label: '评论', color: '#FF9B7A' },
};

function CommentSection({ bvId }: { bvId: string }) {
  const { data: hot, isLoading, isError } = trpc.comments.getTop.useQuery(
    decodeURIComponent(bvId),
    { retry: false, staleTime: 30 * 60 * 1000 },
  );

  if (isLoading) {
    return (
      <div className="card !p-6 animate-pulse">
        <div className="h-4 w-20 rounded bg-kawaii-surface/50 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-kawaii-surface/50" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !hot || hot.comments.length === 0) return null;

  return (
    <div className="card !p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">热评</h2>
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
            className="flex gap-3 p-3 rounded-xl bg-kawaii-surface/80 border border-kawaii-border/30"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-kawaii-text truncate">{c.uname}</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-kawaii-pink shrink-0">
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

export default function SongDetailPage() {
  const { bvId } = useParams<{ bvId: string }>();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: song, isLoading, error } = trpc.songs.getByBvId.useQuery(
    decodeURIComponent(bvId),
  );
  const { data: milestones } = trpc.milestones.getBySong.useQuery(
    song?.id ?? '',
    { enabled: !!song },
  );
  const { data: favorited } = trpc.favorites.isFavorited.useQuery(
    song?.id ?? '',
    { enabled: !!song?.id && !!user },
  );
  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      if (song) utils.favorites.isFavorited.invalidate(song.id);
      utils.favorites.list.invalidate();
    },
  });
  const { data: relatedPosts } = trpc.posts.getBySong.useQuery(
    decodeURIComponent(bvId),
    { enabled: Boolean(bvId) },
  );

  if (isLoading) {
    return (
      <main className="min-h-screen relative">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-4 relative z-10">
          <div className="h-6 w-20 rounded-lg bg-kawaii-surface/50 animate-pulse" />
          <div className="h-10 w-2/3 rounded-xl bg-kawaii-surface/50 animate-pulse" />
          <div className="h-4 w-1/3 rounded-lg bg-kawaii-surface/50 animate-pulse" />
          <div className="h-48 rounded-2xl bg-kawaii-surface/50 animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="min-h-screen relative">
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
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        <div className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-kawaii-border/40">
          <div className="relative aspect-[16/10] sm:aspect-[16/9]">
            {img.src ? (
              <img
                {...img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-kawaii-pink/30 via-kawaii-purple/25 to-kawaii-cyan/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1424] via-[#1a1424]/35 to-transparent md:from-[#1a1424] md:via-[#1a1424]/50 md:to-[#1a1424]/20" />
          </div>
          <div className="relative z-10 px-5 py-5 text-kawaii-text bg-[rgb(var(--surface))]/88 md:absolute md:inset-0 md:flex md:flex-col md:justify-end md:bg-transparent md:p-10 md:text-white">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.slice(0, 8).map((tag) => (
                  <a
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-kawaii-surface text-kawaii-text/85 ring-1 ring-kawaii-border/40 hover:bg-kawaii-surface-hover md:bg-white/15 md:text-white/85 md:ring-white/20 md:hover:bg-white/25"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
            <h1 className="font-display text-2xl md:text-4xl font-bold leading-tight drop-shadow-lg line-clamp-3">
              {song.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-kawaii-muted md:text-white/75 font-medium mt-3">
              <a
                href={`/author/${encodeURIComponent(song.author)}`}
                className="text-kawaii-text font-bold hover:text-kawaii-pink md:text-white md:hover:text-kawaii-pink-light"
              >
                {song.author}
              </a>
              <span className="opacity-40">·</span>
              <span>{new Date(song.publishTime).toLocaleDateString('zh-CN')}</span>
              {song.duration ? (
                <>
                  <span className="opacity-40">·</span>
                  <span>{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</span>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <a
                href={biliUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-pink inline-flex items-center gap-2"
              >
                在B站观看
              </a>
              {user ? (
                <button
                  type="button"
                  className="btn btn-cyan inline-flex items-center gap-2"
                  disabled={toggleFav.isLoading}
                  onClick={() => toggleFav.mutate(song.id)}
                >
                  {favorited ? '已收藏' : '收藏'}
                </button>
              ) : (
                <a href="/login" className="btn btn-cyan inline-flex items-center gap-2">登录后收藏</a>
              )}
              <a
                href={`/song/${song.bvId}/stats`}
                className="btn btn-ghost inline-flex items-center gap-2 md:!bg-white/15 md:!text-white md:!border-white/25"
              >
                详细数据
              </a>
              <a
                href={`/forum/new?song=${encodeURIComponent(song.bvId)}`}
                className="btn btn-ghost inline-flex items-center gap-2 md:!bg-white/15 md:!text-white md:!border-white/25"
              >
                去论坛讨论
              </a>
              <AdminDeleteSongButton
                bvId={song.bvId}
                title={song.title}
                onDeleted={() => {
                  window.location.href = '/';
                }}
              />
            </div>
          </div>
        </div>

        <div className="card !p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">统计数据</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(STAT_COLORS).map(([key, cfg]) => {
              const val = stats[key] ?? 0;
              return (
                <div key={key} className="text-center p-4 rounded-xl bg-kawaii-surface/80 border border-kawaii-border/30">
                  <p className="text-lg md:text-2xl font-black" style={{ color: cfg.color }}>
                    {formatCount(val)}
                  </p>
                  <p className="text-xs text-kawaii-muted font-medium mt-1">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {milestones && milestones.length > 0 && (
          <div className="card !p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">里程碑</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kawaii-surface/80 border border-kawaii-border/30"
                >
                  <div>
                    <p className="text-sm font-black text-kawaii-text">
                      {m.threshold >= 10000
                        ? `${(m.threshold / 10000).toFixed(0)} 万`
                        : m.threshold}{' '}
                      播放达成
                    </p>
                    <p className="text-[10px] text-kawaii-muted font-medium">
                      {new Date(m.achievedAt).toLocaleDateString('zh-CN')}
                      {' · '}
                      {(m as { isEstimated?: boolean }).isEstimated ? '补记' : '精确'}
                      {' '}{m.playCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <a href={`/song/${song.bvId}/stats`} className="card !p-6 block group hover:border-kawaii-pink/30 transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">详细数据</h2>
              <p className="text-sm text-kawaii-text/80 font-medium mt-1">播放走势、互动率、相对图均雷达和日快照</p>
            </div>
            <span className="text-xs font-bold text-kawaii-pink shrink-0 group-hover:translate-x-0.5 transition-transform">
              打开 →
            </span>
          </div>
          {song.dailyStats && song.dailyStats.length >= 2 ? (
            <Sparkline
              values={[...song.dailyStats].reverse().map((d: { playCount: number }) => d.playCount)}
              color="#39C5BB"
              className="w-full h-20"
            />
          ) : (
            <p className="text-xs text-kawaii-muted">快照还不够，先看当前统计</p>
          )}
        </a>

        {song && (
          <CommentSection bvId={bvId} />
        )}

        <div className="card !p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs text-kawaii-muted font-bold tracking-wider uppercase mb-2">综合评分</p>
            <p className="font-display text-5xl md:text-7xl font-bold text-gradient-flow">
              {song.score.toFixed(1)}
            </p>
          </div>
        </div>

        {song.description && (
          <DescriptionBlock text={song.description} />
        )}

        <div className="card !p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">论坛讨论</h2>
            <a
              href={`/forum/new?song=${encodeURIComponent(song.bvId)}`}
              className="text-xs font-bold text-kawaii-pink hover:underline"
            >
              写评测
            </a>
          </div>
          {!relatedPosts?.length ? (
            <p className="text-sm text-kawaii-muted font-medium">还没有人讨论这首歌</p>
          ) : (
            <div className="space-y-2">
              {relatedPosts.map((p) => (
                <a
                  key={p.id}
                  href={`/forum/post/${p.id}`}
                  className="block text-sm font-bold text-kawaii-text hover:text-kawaii-pink truncate"
                >
                  {p.title}
                  <span className="ml-2 text-xs font-medium text-kawaii-muted">
                    {p.author.username} · {p._count.replies} 回复
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex justify-center gap-3">
            <a href="/" className="btn btn-ghost !py-2 !px-6 text-sm">&larr; 返回首页</a>
            <a href="/ranking" className="btn btn-pink !py-2 !px-6 text-sm">排行榜</a>
          </div>
        </div>
      </div>
    </main>
  );
}

function DescriptionBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280;
  return (
    <div className="card !p-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-bold text-kawaii-muted tracking-wider uppercase">歌曲简介</h2>
      </div>
      <p className={`text-sm text-kawaii-text/80 font-medium leading-relaxed whitespace-pre-wrap ${!open && long ? 'line-clamp-8' : ''}`}>
        {text}
      </p>
      {long && (
        <button type="button" className="mt-2 text-xs font-bold text-kawaii-pink" onClick={() => setOpen((v) => !v)}>
          {open ? '收起' : '展开全部'}
        </button>
      )}
    </div>
  );
}
