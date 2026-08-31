'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen relative">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 relative z-10">
        <p className="text-[11px] font-bold tracking-[0.42em] text-kawaii-cyan mb-4">ABOUT</p>
        <h1 className="font-display text-4xl font-bold text-gradient-flow tracking-widest mb-8">关于</h1>
        <div className="card !p-8 space-y-5">
          <p className="text-base text-kawaii-text/85 leading-relaxed">
            VOCALOID Hub 收录 B 站上的虚拟歌手原创曲，按公开数据做排行和统计。
          </p>
          <p className="text-sm text-kawaii-muted leading-relaxed">
            想听原曲请去 B 站。这里只看数据和讨论。
          </p>
        </div>
      </div>
    </main>
  );
}
