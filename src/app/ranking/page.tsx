'use client';

export default function RankingPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">排行榜</h1>
      <p className="text-gray-400">日榜 / 周榜 / 月榜 / 总榜</p>
      <div className="mt-8 grid gap-4">
        {['日榜', '周榜', '月榜', '总榜'].map((period) => (
          <div
            key={period}
            className="rounded-xl bg-white/5 border border-white/10 p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">{period}</h2>
            <p className="text-gray-500">数据加载中...</p>
          </div>
        ))}
      </div>
    </main>
  );
}
