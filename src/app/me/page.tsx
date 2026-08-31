'use client';

import { useState, FormEvent } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';
import { coverImgProps, timeAgo } from '@/lib/utils';

export default function MePage() {
  const { user, isLoading: authLoading, refresh } = useAuth();
  const { data: me } = trpc.users.me.useQuery(undefined, { enabled: !!user });
  const { data: posts } = trpc.users.myPosts.useQuery(undefined, { enabled: !!user });
  const { data: favs } = trpc.favorites.list.useQuery(undefined, { enabled: !!user });
  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => refresh(),
  });
  const changePassword = trpc.users.changePassword.useMutation();
  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  if (authLoading) {
    return (
      <main className="min-h-screen relative">
        <p className="max-w-3xl mx-auto px-4 py-16 text-kawaii-muted">加载中…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen relative">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-kawaii-muted font-medium mb-4">登录后可查看个人页。</p>
          <a href="/login" className="btn btn-pink !py-1.5 !px-4 text-xs">去登录</a>
        </div>
      </main>
    );
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim() || me?.username;
    if (!name) return;
    update.mutate({ username: name }, { onSuccess: () => setSaved(true) });
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    setPasswordErr('');
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordErr('两次输入的新密码不一致');
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMsg('密码已更新');
        },
        onError: (err) => setPasswordErr(err.message || '修改失败'),
      },
    );
  };

  return (
    <main className="min-h-screen relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        <h1 className="text-lg font-black tracking-wide text-gradient-flow">我的主页</h1>

        <section className="card !p-6 space-y-4">
          <p className="text-sm text-kawaii-muted font-medium">
            {me?.email} · 帖子 {me?._count.posts ?? 0} · 收藏 {me?._count.favorites ?? 0}
          </p>
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 rounded-xl bg-kawaii-void/70 border border-kawaii-border/50 text-sm outline-none"
              placeholder={me?.username || '昵称'}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setSaved(false); }}
            />
            <button type="submit" className="btn btn-pink !py-2 !px-4 text-xs" disabled={update.isLoading}>
              保存昵称
            </button>
          </form>
          {saved && <p className="text-xs text-kawaii-cyan">已更新</p>}
        </section>

        <section className="card !p-6 space-y-4">
          <h2 className="text-sm font-black text-kawaii-text">修改密码</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-2 rounded-xl bg-kawaii-void/70 border border-kawaii-border/50 text-sm outline-none"
              placeholder="当前密码"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErr(''); setPasswordMsg(''); }}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-xl bg-kawaii-void/70 border border-kawaii-border/50 text-sm outline-none"
              placeholder="新密码（至少 6 位）"
              value={newPassword}
              minLength={6}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordErr(''); setPasswordMsg(''); }}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-xl bg-kawaii-void/70 border border-kawaii-border/50 text-sm outline-none"
              placeholder="确认新密码"
              value={confirmPassword}
              minLength={6}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErr(''); setPasswordMsg(''); }}
              required
            />
            <button type="submit" className="btn btn-pink !py-2 !px-4 text-xs" disabled={changePassword.isLoading}>
              {changePassword.isLoading ? '保存中…' : '更新密码'}
            </button>
          </form>
          {passwordMsg && <p className="text-xs text-kawaii-cyan">{passwordMsg}</p>}
          {passwordErr && <p className="text-xs text-kawaii-pink">{passwordErr}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">我的收藏</h2>
          {!favs?.length ? (
            <p className="text-xs text-kawaii-muted">还没有收藏歌曲。</p>
          ) : (
            <div className="grid gap-2">
              {favs.map((f) => {
                const img = coverImgProps(f.song.picUrl);
                return (
                  <a key={f.id} href={`/song/${f.song.bvId}`} className="card flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-kawaii-surface">
                      {img.src ? <img {...img} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{f.song.title}</p>
                      <p className="text-xs text-kawaii-muted">{f.song.author}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">我的帖子</h2>
          {!posts?.length ? (
            <p className="text-xs text-kawaii-muted">还没有发帖。</p>
          ) : (
            <div className="space-y-2">
              {posts.map((p) => (
                <a key={p.id} href={`/forum/post/${p.id}`} className="block card p-3">
                  <p className="text-sm font-bold truncate">{p.title}</p>
                  <p className="text-xs text-kawaii-muted">{timeAgo(p.createdAt)} · ♡ {p.likes}</p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
