'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-pink-50">
      <div className="text-center space-y-4 p-8">
        <p className="text-4xl text-kawaii-muted" aria-hidden="true">♪</p>
        <h1 className="text-lg font-black text-kawaii-text">出错了</h1>
        <p className="text-sm text-kawaii-muted font-medium">页面加载遇到问题</p>
        <button
          onClick={reset}
          className="btn btn-pink text-sm"
        >
          重试
        </button>
      </div>
    </main>
  );
}
