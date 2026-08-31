'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <p className="font-display text-4xl text-gradient-flow" aria-hidden="true">歌</p>
        <h1 className="font-display text-2xl font-bold text-kawaii-text">出错了</h1>
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
