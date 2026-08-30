'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';

const POST_TYPES = [
  { key: 'review', label: '评测', icon: '◇' },
  { key: 'recommend', label: '推荐', icon: '◆' },
  { key: 'discussion', label: '讨论', icon: '○' },
  { key: 'question', label: '提问', icon: '△' },
];

function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('discussion');
  const [tagsStr, setTagsStr] = useState('');
  const [error, setError] = useState('');
  const [songQ, setSongQ] = useState('');
  const [related, setRelated] = useState<{ bvId: string; title: string }[]>([]);
  const presetBv = searchParams.get('song')?.trim() || '';
  const presetSong = trpc.songs.getByBvIds.useQuery(presetBv ? [presetBv] : [], {
    enabled: presetBv.length >= 3,
  });
  useEffect(() => {
    const hit = presetSong.data?.[0];
    if (!hit) return;
    setRelated((prev) => (prev.some((r) => r.bvId === hit.bvId) ? prev : [{ bvId: hit.bvId, title: hit.title }, ...prev].slice(0, 5)));
  }, [presetSong.data]);
  const songSearch = trpc.songs.search.useQuery(
    { q: songQ, limit: 6 },
    { enabled: songQ.trim().length >= 2 },
  );

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: (post) => {
      router.push(`/forum/post/${post.id}`);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const tags = tagsStr
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    createMutation.mutate({
      title,
      content,
      type: type as any,
      tags,
      relatedSongs: related.map((s) => s.bvId),
    });
  };

  if (!user) {
    return (
      <main className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 text-center">
          <p className="text-kawaii-muted mb-4 font-bold">请先登录 ⋆</p>
          <a href="/login" className="btn btn-pink">去登录</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="card !p-8">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-kawaii-pink-pale border border-kawaii-pink/20 text-kawaii-pink text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 标题 */}
            <div>
              <label className="block text-xs text-kawaii-muted mb-2 font-bold tracking-wider">标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入帖子标题"
                required
                minLength={2}
                maxLength={100}
                className="w-full"
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-xs text-kawaii-muted mb-2 font-bold tracking-wider">分类</label>
              <div className="flex gap-2 flex-wrap">
                {POST_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      type === t.key
                        ? 'bg-kawaii-pink text-white shadow-md'
                        : 'bg-white/70 text-kawaii-muted border border-kawaii-border hover:border-kawaii-pink/30'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-xs text-kawaii-muted mb-2 font-bold tracking-wider">内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的想法、评测或问题..."
                rows={10}
                required
                minLength={10}
                maxLength={10000}
                className="w-full"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-xs text-kawaii-muted mb-2 font-bold tracking-wider">
                标签 <span className="font-normal">(空格或逗号分隔)</span>
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="初音未来 神调教 原创曲"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-kawaii-muted mb-2 font-bold tracking-wider">关联歌曲（可选）</label>
              <input
                type="text"
                value={songQ}
                onChange={(e) => setSongQ(e.target.value)}
                placeholder="搜索歌曲标题或作者"
                className="w-full"
              />
              {songSearch.data?.songs?.length ? (
                <div className="mt-2 space-y-1">
                  {songSearch.data.songs.map((s) => (
                    <button
                      key={s.bvId}
                      type="button"
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl bg-white/70 hover:bg-kawaii-pink-pale"
                      onClick={() => {
                        if (related.some((r) => r.bvId === s.bvId) || related.length >= 5) return;
                        setRelated((prev) => [...prev, { bvId: s.bvId, title: s.title }]);
                        setSongQ('');
                      }}
                    >
                      {s.title} · {s.author}
                    </button>
                  ))}
                </div>
              ) : null}
              {related.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {related.map((s) => (
                    <button
                      key={s.bvId}
                      type="button"
                      className="text-[11px] font-bold px-3 py-1 rounded-full bg-kawaii-surface"
                      onClick={() => setRelated((prev) => prev.filter((x) => x.bvId !== s.bvId))}
                    >
                      {s.title} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href="/forum"
                className="btn btn-ghost"
              >
                取消
              </a>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="btn btn-pink"
              >
                {createMutation.isLoading ? '发布中...' : '发布 ⋆'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function NewPostPageDefault() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen relative flex items-center justify-center">
          <div className="text-kawaii-muted font-medium">加载中...</div>
        </main>
      }
    >
      <NewPostPage />
    </Suspense>
  );
}
