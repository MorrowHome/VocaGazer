'use client';


const STACK = [
  { name: 'Next.js 14', sym: '◈' },
  { name: 'React 18', sym: '◇' },
  { name: 'tRPC', sym: '○' },
  { name: 'Prisma + SQLite', sym: '□' },
  { name: 'Tailwind CSS', sym: '△' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-8">
        {/* ─── 简介 ─── */}
        <div className="card !p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl text-kawaii-pink" aria-hidden="true">♪</span>
            <div>
              <h2 className="text-xl font-black text-kawaii-text">VOCALOID Music Hub</h2>
              <p className="text-xs text-kawaii-muted font-medium mt-0.5">虚拟歌手原创音乐平台</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-kawaii-text/80 font-medium leading-relaxed">
            <p>
              VOCALOID Music Hub 是一个专注于 VOCALOID 原创曲目的数据收集、分析与展示平台。
              我们用可爱的方式记录每一首动人的虚拟歌手原创音乐 ⋆
            </p>
            <p>
              平台每日自动从 B 站 API 抓取新发布的 VOCALOID 音乐，通过科学的评分系统生成排行榜，
              并设有数据分析和用户社区论坛，让每一位 VOCALOID 爱好者都能发现和分享好音乐。
            </p>
          </div>
        </div>

        {/* ─── 技术栈 ─── */}
        <div className="card !p-8">
          <div className="flex items-center gap-2 mb-5">
            <span aria-hidden="true" className="text-kawaii-cyan text-lg">◈</span>
            <h2 className="section-title text-kawaii-text">技术栈</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STACK.map((item) => (
              <div key={item.name} className="text-center p-4 rounded-xl bg-white/70 border border-kawaii-border/30 hover:border-kawaii-pink/20 transition-all">
                <p className="text-2xl mb-1">{item.sym}</p>
                <p className="text-xs font-black text-kawaii-text">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 致谢 ─── */}
        <div className="text-center py-6">
          <p className="text-sm text-kawaii-muted font-medium">
            ⋆｡°✩ 用 <span className="text-kawaii-pink">♡</span> 发电 ✩°｡⋆
          </p>
        </div>
      </div>
    </main>
  );
}
