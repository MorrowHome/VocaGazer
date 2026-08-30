'use client';

import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const status = trpc.crawl.status.useQuery(undefined, { enabled: user?.role === 'admin' });
  const posts = trpc.posts.getLatest.useQuery(
    { page: 1, limit: 15, sort: 'latest' },
    { enabled: user?.role === 'admin' },
  );
  const trigger = trpc.crawl.trigger.useMutation({
    onSuccess: () => utils.crawl.status.invalidate(),
  });
  const ranks = trpc.crawl.generateRanks.useMutation();
  const pin = trpc.posts.pin.useMutation({
    onSuccess: () => utils.posts.getLatest.invalidate(),
  });

  if (authLoading) {
    return (
      <main className="min-h-screen relative">
        <p className="max-w-3xl mx-auto px-4 py-16 text-kawaii-muted font-medium">加载中…</p>
      </main>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <main className="min-h-screen relative">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-kawaii-muted font-medium">需要管理员账号才能进入此页。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        <h1 className="text-lg font-black tracking-wide text-gradient-flow">管理台</h1>

        <section className="card !p-6 space-y-4">
          <h2 className="text-sm font-black text-kawaii-text">采集与排行</h2>
          <p className="text-xs text-kawaii-muted font-medium">
            上次采集：{status.data?.last_crawl_time || '未知'} · 开关：{status.data?.crawl_enabled ?? '—'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-pink !py-1.5 !px-4 text-xs"
              disabled={trigger.isLoading}
              onClick={() => trigger.mutate({ withinHours: 72 })}
            >
              {trigger.isLoading ? '采集中…' : '触发采集'}
            </button>
            <button
              type="button"
              className="btn btn-cyan !py-1.5 !px-4 text-xs"
              disabled={ranks.isLoading}
              onClick={() => ranks.mutate()}
            >
              {ranks.isLoading ? '生成中…' : '生成排行榜'}
            </button>
          </div>
          {trigger.data && !trigger.data.skipped && (
            <p className="text-xs text-kawaii-muted">采集完成：入库 {trigger.data.savedCount} 首</p>
          )}
          {ranks.data && (
            <p className="text-xs text-kawaii-muted">排行：日 {ranks.data.daily} / 周 {ranks.data.weekly} / 总 {ranks.data.alltime}</p>
          )}
          {(trigger.error || ranks.error) && (
            <p className="text-xs text-kawaii-pink">{trigger.error?.message || ranks.error?.message}</p>
          )}
        </section>

        <section className="card !p-6 space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">帖子置顶</h2>
          {posts.data?.posts.map((post) => (
            <div key={post.id} className="flex items-center gap-3 text-sm">
              <a href={`/forum/post/${post.id}`} className="flex-1 truncate font-bold text-kawaii-text hover:text-kawaii-pink">
                {post.isPinned ? '◆ ' : ''}{post.title}
              </a>
              <button
                type="button"
                className="text-xs font-bold text-kawaii-muted hover:text-kawaii-pink"
                onClick={() => pin.mutate({ id: post.id, isPinned: !post.isPinned })}
              >
                {post.isPinned ? '取消置顶' : '置顶'}
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
