'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { SparkleInput } from '@/components/motion/SparkleInput';

const LINKS = [
  { href: '/recommend', label: '推荐' },
  { href: '/search', label: '搜索' },
  { href: '/ranking', label: '排行榜' },
  { href: '/tags', label: '标签' },
  { href: '/milestones', label: '里程碑' },
  { href: '/authors', label: '创作者' },
  { href: '/analytics', label: '数据分析' },
  { href: '/forum', label: '论坛' },
  { href: '/about', label: '关于' },
] as const;

const MOBILE_LINKS = [
  { href: '/', label: '首页' },
  { href: '/ranking', label: '排行' },
  { href: '/recommend', label: '推荐' },
  { href: '/search', label: '搜索' },
  { href: '/forum', label: '论坛' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/55 border-b border-kawaii-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg text-kawaii-pink" aria-hidden="true">♪</span>
            <span className="text-lg font-black tracking-wide text-gradient-flow">VOCALOID HUB</span>
          </a>

          <nav className="hidden lg:flex items-center gap-4 text-sm font-bold text-kawaii-muted overflow-x-auto">
            {LINKS.filter((link) => link.href !== '/search').map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`hover:text-kawaii-pink transition-colors whitespace-nowrap ${
                  isActive(pathname, link.href) ? 'text-kawaii-pink' : ''
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <form action="/search" method="get" className="hidden md:block w-40 lg:w-48 xl:w-56">
            <SparkleInput>
              <input
                type="search"
                name="q"
                placeholder="搜歌或作者…"
                className="w-full h-8 px-3 rounded-full bg-white/80 border border-kawaii-border/50 text-xs outline-none focus:border-kawaii-pink/40"
              />
            </SparkleInput>
          </form>

          <div className="flex items-center gap-3 shrink-0">
            {user?.role === 'admin' && (
              <a
                href="/admin"
                className={`text-sm font-bold transition-colors ${
                  isActive(pathname, '/admin') ? 'text-kawaii-pink' : 'text-kawaii-muted hover:text-kawaii-pink'
                }`}
              >
                管理
              </a>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <a
                  href="/me"
                  className="text-sm text-kawaii-muted hover:text-kawaii-pink font-bold truncate max-w-[7rem]"
                >
                  {user.username}
                </a>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-kawaii-muted hover:text-kawaii-pink transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <a href="/login" className="btn btn-pink !py-1.5 !px-4 text-xs">
                登录
              </a>
            )}
          </div>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-lg border-t border-kawaii-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {MOBILE_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center justify-center text-xs font-bold ${
                isActive(pathname, link.href) ? 'text-kawaii-pink' : 'text-kawaii-muted'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
