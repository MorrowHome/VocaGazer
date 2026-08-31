'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 relative z-10 space-y-8">
        <div className="card !p-8 space-y-4">
          <h1 className="font-display text-2xl font-bold text-kawaii-text">关于</h1>
          <p className="text-sm text-kawaii-text/80 font-medium leading-relaxed">
            VOCALOID Hub 收录 B 站上的虚拟歌手原创曲，按公开数据做排行和统计。
          </p>
          <p className="text-sm text-kawaii-text/80 font-medium leading-relaxed">
            想听原曲请去 B 站。这里只看数据和讨论。
          </p>
        </div>
      </div>
    </main>
  );
}
