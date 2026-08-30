'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';
import { timeAgo } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  review: '◇ 评测',
  recommend: '◆ 推荐',
  discussion: '○ 讨论',
  question: '△ 提问',
};

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: post, isLoading } = trpc.posts.getById.useQuery(postId);
  const relatedIds = useMemo(() => {
    try {
      const raw = JSON.parse(post?.relatedSongs || '[]');
      return Array.isArray(raw) ? raw.filter((x: unknown) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }, [post?.relatedSongs]);
  const { data: relatedSongs } = trpc.songs.getByBvIds.useQuery(relatedIds, {
    enabled: relatedIds.length > 0,
  });
  const utils = trpc.useUtils();
  const replyMutation = trpc.posts.reply.useMutation({
    onSuccess: () => {
      setReplyContent('');
      setReplyError('');
      utils.posts.getById.invalidate(postId);
    },
    onError: (err) => setReplyError(err.message),
  });
  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => utils.posts.getById.invalidate(postId),
  });
  const likeMutation = trpc.posts.like.useMutation({
    onSuccess: () => utils.posts.getById.invalidate(postId),
  });
  const likeReply = trpc.posts.likeReply.useMutation({
    onSuccess: () => utils.posts.getById.invalidate(postId),
  });
  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      utils.posts.getById.invalidate(postId);
    },
  });

  const handleReply = (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate({ postId, content: replyContent });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 text-kawaii-muted font-medium">加载中...</div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 text-kawaii-muted font-medium">帖子不存在</div>
      </main>
    );
  }

  const tags: string[] = (() => {
    try {
      const t = JSON.parse(post.tags || '[]');
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  })();
  const likedReplies = new Set(post.likedReplyIds ?? []);

  return (
    <main className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-6">
        <div className="card !p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm">{TYPE_LABELS[post.type] || post.type}</span>
            {post.isPinned && <span className="text-xs text-kawaii-pink font-bold">◆ 置顶</span>}
          </div>

          {editing ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updatePost.mutate({ id: postId, title: editTitle, content: editContent });
              }}
            >
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full" required minLength={2} />
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={8} className="w-full" required minLength={10} />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-pink !py-1.5 !px-4 text-xs" disabled={updatePost.isLoading}>
                  {updatePost.isLoading ? '保存中…' : '保存'}
                </button>
                <button type="button" className="btn btn-ghost !py-1.5 !px-4 text-xs" onClick={() => setEditing(false)}>取消</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-black text-kawaii-text mb-3">{post.title}</h1>
              <div className="flex items-center gap-3 text-xs text-kawaii-muted mb-5 font-medium">
                <span>{post.author.username}</span>
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
                <span>·</span>
                <span>♢ {post.views}</span>
                <span>♡ {post.likes}</span>
              </div>
              <div className="text-sm text-kawaii-text/80 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            </>
          )}

          {tags.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {tags.map((tag: string) => (
                <a
                  key={tag}
                  href={`/forum?q=${encodeURIComponent(tag)}`}
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-kawaii-surface text-kawaii-muted hover:text-kawaii-pink"
                >
                  #{tag}
                </a>
              ))}
            </div>
          )}

          {relatedSongs && relatedSongs.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-kawaii-muted">关联歌曲</p>
              {relatedSongs.map((s) => (
                <a key={s.bvId} href={`/song/${s.bvId}`} className="block text-sm font-bold text-kawaii-pink hover:underline truncate">
                  {s.title} · {s.author}
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {user && (
              <button
                onClick={() => likeMutation.mutate(postId)}
                className="btn btn-pink !py-1.5 !px-4 text-xs"
              >
                ♡ {post.likedByMe ? '已赞' : '点赞'}
              </button>
            )}
            {user && (user.id === post.authorId || user.role === 'admin') && !editing && (
              <button
                onClick={() => {
                  setEditTitle(post.title);
                  setEditContent(post.content);
                  setEditing(true);
                }}
                className="btn btn-ghost !py-1.5 !px-4 text-xs"
              >
                编辑
              </button>
            )}
            {user && (user.id === post.authorId || user.role === 'admin') && (
              <button
                onClick={() => deleteMutation.mutate(postId)}
                className="btn btn-ghost !py-1.5 !px-4 text-xs"
              >
                删除
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black text-kawaii-text mb-4">
            回复（{post.replies?.length || 0}）
          </h2>

          {!post.replies?.length ? (
            <p className="text-kawaii-muted text-sm font-medium">暂无回复</p>
          ) : (
            <div className="space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="card !p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black text-kawaii-text">{reply.author.username}</span>
                    <span className="text-xs text-kawaii-muted">{timeAgo(reply.createdAt)}</span>
                    {user && (
                      <button
                        type="button"
                        className="ml-auto text-xs font-bold text-kawaii-muted hover:text-kawaii-pink"
                        onClick={() => likeReply.mutate(reply.id)}
                      >
                        ♡ {likedReplies.has(reply.id) ? '已赞' : '点赞'} {reply.likes}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-kawaii-text/80 whitespace-pre-wrap leading-relaxed">
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <form onSubmit={handleReply} className="space-y-3">
            {replyError && (
              <p className="text-kawaii-pink text-xs font-medium">{replyError}</p>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              rows={4}
              required
              className="w-full"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replyMutation.isLoading}
                className="btn btn-pink !py-2 !px-6"
              >
                {replyMutation.isLoading ? '发送中...' : '发送回复'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <a href="/login" className="text-kawaii-pink text-sm hover:underline font-bold">
              登录后可以回复
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
