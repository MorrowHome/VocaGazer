import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-pink-50">
      <div className="text-center space-y-4 p-8">
        <p className="text-4xl text-kawaii-muted" aria-hidden="true">♪</p>
        <h1 className="text-lg font-black text-kawaii-text">404</h1>
        <p className="text-sm text-kawaii-muted font-medium">页面未找到</p>
        <Link href="/" className="btn btn-pink text-sm inline-block">
          返回首页
        </Link>
      </div>
    </main>
  );
}
