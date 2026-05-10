'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';
import { timeAgo } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  review: '评测',
  recommend: '推荐',
  discussion: '讨论',
  question: '提问',
};

const TYPE_CATS: Record<string, string> = {
  review: '◇',
  recommend: '◆',
  discussion: '○',
  question: '△',
};

export default function ForumPage() {
  const { user } = useAuth();
  const [type, setType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.posts.getLatest.useQuery({
    page,
    limit: 20,
    type: type as any,
    sort: 'latest',
  });

  return (
    <main className="min-h-screen relative">
      <ClickFireworks />
      <BackgroundLayers />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-kawaii-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回</a>
            <span className="text-kawaii-pink text-lg" aria-hidden="true">◈</span>
            <h1 className="text-lg font-black tracking-wide text-gradient-flow">社区论坛</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <a href="/forum/new" className="btn btn-pink !py-1.5 !px-4 text-xs">+ 发帖</a>
                <span className="text-sm text-kawaii-muted font-bold">{user.username}</span>
              </div>
            ) : (
              <a href="/login" className="btn btn-pink !py-1.5 !px-4 text-xs">登录</a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {/* 分类筛选 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => { setType(undefined); setPage(1); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              !type
                ? 'bg-kawaii-pink text-white shadow-md'
                : 'bg-white/70 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
            }`}
          >
            全部
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setType(key); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                type === key
                  ? 'bg-kawaii-pink text-white shadow-md'
                  : 'bg-white/70 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
              }`}
            >
              {TYPE_CATS[key]} {label}
            </button>
          ))}
        </div>

        {/* 帖子列表 */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : !data?.posts?.length ? (
          <div className="text-center py-20">
            <p className="text-kawaii-muted text-lg font-bold mb-3">暂无帖子</p>
            <p className="text-kawaii-muted/60 text-sm mb-4">快来成为第一个发帖的人吧 ⋆</p>
            {user && (
              <a href="/forum/new" className="btn btn-pink">写新帖子</a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.posts.map((post) => (
              <a
                key={post.id}
                href={`/forum/post/${post.id}`}
                className="block card hover:border-kawaii-pink/20"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* 类型标签 */}
                  <span
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0"
                    style={{
                      background: type === 'review' ? '#FFF0F5' : type === 'recommend' ? '#E8F8F7' : type === 'discussion' ? '#FFF8F0' : '#F3ECFF',
                      color: type === 'review' ? '#FF6B9D' : type === 'recommend' ? '#39BEB9' : type === 'discussion' ? '#F7C94C' : '#B388FF',
                    }}
                  >
                    {TYPE_CATS[post.type] || '◇'} {TYPE_LABELS[post.type] || post.type}
                  </span>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {post.isPinned && <span className="text-[10px] text-kawaii-pink font-bold">◆ 置顶</span>}
                      <h3 className="text-sm font-bold text-kawaii-text truncate">{post.title}</h3>
                    </div>
                    <p className="text-xs text-kawaii-muted truncate mt-0.5">
                      {post.author.username} · {timeAgo(post.createdAt)}
                    </p>
                  </div>

                  {/* 统计 */}
                  <div className="flex items-center gap-4 text-xs text-kawaii-muted shrink-0">
                    <span>◇ {post._count.replies}</span>
                    <span>♢ {post.views}</span>
                    <span>♡ {post.likes}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                  p === page
                    ? 'bg-kawaii-pink text-white shadow-md'
                    : 'bg-white/70 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
