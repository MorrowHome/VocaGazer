'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';
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

function ForumPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q')?.trim() ?? '';
  const [type, setType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'latest' | 'hottest'>('latest');
  const [q, setQ] = useState(initialQ);
  const [qDraft, setQDraft] = useState(initialQ);

  const { data, isLoading } = trpc.posts.getLatest.useQuery({
    page,
    limit: 20,
    type: type as any,
    sort,
    q: q || undefined,
  });

  return (
    <main className="min-h-screen relative">


      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-black tracking-wide text-gradient-flow">社区论坛</h1>
          {user ? (
            <a href="/forum/new" className="btn btn-pink !py-1.5 !px-4 text-xs">+ 发帖</a>
          ) : (
            <a href="/login" className="text-xs font-bold text-kawaii-muted hover:text-kawaii-pink">登录后发帖</a>
          )}
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['latest', 'hottest'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSort(s); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                sort === s
                  ? 'bg-kawaii-cyan text-white shadow-md'
                  : 'bg-white/70 text-kawaii-muted border border-kawaii-border'
              }`}
            >
              {s === 'latest' ? '最新' : '最热'}
            </button>
          ))}
          <form
            className="flex-1 min-w-[12rem]"
            onSubmit={(e) => { e.preventDefault(); setQ(qDraft.trim()); setPage(1); }}
          >
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="搜索帖子…"
              className="w-full px-4 py-2 rounded-full bg-white/80 border border-kawaii-border/50 text-xs outline-none"
            />
          </form>
        </div>

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
                target="_blank"
                rel="noopener noreferrer"
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

export default function ForumPageDefault() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen relative">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        </main>
      }
    >
      <ForumPage />
    </Suspense>
  );
}
