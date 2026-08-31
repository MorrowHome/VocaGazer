import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <p className="font-display text-5xl text-gradient-flow">404</p>
        <h1 className="font-display text-2xl font-bold text-kawaii-text">未找到</h1>
        <p className="text-sm text-kawaii-muted font-medium">这一页不在今夜的歌单里</p>
        <Link href="/" className="btn btn-pink text-sm inline-block">
          返回首页
        </Link>
      </div>
    </main>
  );
}
