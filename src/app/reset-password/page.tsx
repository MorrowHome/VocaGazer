'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const reset = trpc.users.resetPassword.useMutation({
    onSuccess: () => router.push('/login'),
    onError: (err) => setError(err.message || '重置失败'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    reset.mutate({ token, password });
  };

  if (token.length < 16) {
    return (
      <p className="text-sm text-kawaii-muted font-medium text-center">
        链接无效。请从邮件重新打开，或
        <a href="/forgot-password" className="text-kawaii-pink hover:underline font-bold"> 再申请一次</a>。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-kawaii-pink-pale border border-kawaii-pink/20 text-kawaii-pink text-sm text-center font-medium">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs text-kawaii-muted mb-1.5 font-bold tracking-wider">新密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 6 位"
          required
          minLength={6}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-xs text-kawaii-muted mb-1.5 font-bold tracking-wider">确认密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="再输入一次"
          required
          minLength={6}
          className="w-full"
        />
      </div>
      <button
        type="submit"
        disabled={reset.isLoading}
        className="btn btn-pink w-full justify-center !py-3"
      >
        {reset.isLoading ? '保存中…' : '设置新密码'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card !p-8">
          <a href="/login" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">
            &larr; 返回登录
          </a>
          <div className="text-center mt-6 mb-8">
            <span className="text-3xl block mb-2 text-kawaii-pink" aria-hidden="true">♪</span>
            <h1 className="text-2xl font-black text-gradient-flow">设置新密码</h1>
          </div>
          <Suspense fallback={<p className="text-sm text-kawaii-muted text-center font-medium">加载中…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
