'use client';

import { useState, FormEvent } from 'react';
import { trpc } from '@/lib/trpc';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const requestReset = trpc.users.requestPasswordReset.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => setError(err.message || '发送失败'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    requestReset.mutate({ email });
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card !p-8">
          <a href="/login" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">
            &larr; 返回登录
          </a>

          <div className="text-center mt-6 mb-8">
            <span className="font-display text-3xl block mb-2 text-gradient-flow" aria-hidden="true">歌</span>
            <h1 className="font-display text-3xl font-bold text-gradient-flow tracking-widest">找回密码</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-kawaii-pink-pale border border-kawaii-pink/20 text-kawaii-pink text-sm text-center font-medium">
              {error}
            </div>
          )}

          {done ? (
            <p className="text-sm text-kawaii-text/80 font-medium leading-relaxed text-center">
              如果该邮箱已注册，请到收件箱打开重置链接（1 小时内有效）。QQ 邮箱请查「垃圾箱」和「订阅邮件」。
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-kawaii-muted mb-1.5 font-bold tracking-wider">注册邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={requestReset.isLoading}
                className="btn btn-pink w-full justify-center !py-3"
              >
                {requestReset.isLoading ? '提交中…' : '发送重置链接'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
