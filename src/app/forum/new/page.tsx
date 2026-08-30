'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';

const POST_TYPES = [
  { key: 'review', label: '评测', icon: '◇' },
  { key: 'recommend', label: '推荐', icon: '◆' },
  { key: 'discussion', label: '讨论', icon: '○' },
  { key: 'question', label: '提问', icon: '△' },
];

export default function NewPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('discussion');
  const [tagsStr, setTagsStr] = useState('');
  const [error, setError] = useState('');

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

    createMutation.mutate({ title, content, type: type as any, tags });
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

            <div className="flex justify-end gap-3 pt-2">
              <a
                href="/forum"
                className="btn btn-ghost"
              >
                取消
              </a>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-pink"
              >
                {createMutation.isPending ? '发布中...' : '发布 ⋆'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
