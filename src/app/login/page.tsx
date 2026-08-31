'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await utils.client.users.login.mutate({ email, password });
      login(result.token, result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center">

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card !p-8">
          <a href="/" className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors font-medium">&larr; 返回首页</a>

          <div className="text-center mt-6 mb-8">
            <span className="font-display text-3xl block mb-2 text-gradient-flow" aria-hidden="true">歌</span>
            <h1 className="font-display text-3xl font-bold text-gradient-flow tracking-widest">登录</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-kawaii-pink-pale border border-kawaii-pink/20 text-kawaii-pink text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-kawaii-muted mb-1.5 font-bold tracking-wider">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-kawaii-muted mb-1.5 font-bold tracking-wider">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>

            <p className="text-right -mt-3">
              <a href="/forgot-password" className="text-xs font-bold text-kawaii-muted hover:text-kawaii-pink">
                忘记密码？
              </a>
            </p>

            <button
              type="submit"
              className="btn btn-pink w-full justify-center !py-3"
            >
              登录
            </button>
          </form>

          <p className="text-center text-xs text-kawaii-muted mt-6 font-medium">
            还没有账号？{' '}
            <a href="/register" className="text-kawaii-pink hover:underline font-bold">注册</a>
          </p>
        </div>
      </div>
    </main>
  );
}
