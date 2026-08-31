'use client';

export default function AboutPage() {
  return (
    <main className="min-h-screen relative">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 relative z-10">
        <p className="text-[11px] font-bold tracking-[0.42em] text-kawaii-pink mb-4">ABOUT</p>
        <h1 className="font-display text-4xl font-bold text-gradient-flow tracking-widest mb-8">关于</h1>
        <div className="card !p-8 space-y-5">
          <p className="text-base text-kawaii-text/85 leading-relaxed">
            VOCALOID Hub 收录 B 站上的虚拟歌手原创曲，按公开数据做排行和统计。
          </p>
          <p className="text-sm text-kawaii-muted leading-relaxed">
            想听原曲请去 B 站。这里只看数据和讨论。
          </p>
        </div>

        <section className="card !p-8 space-y-4 mt-6">
          <h2 className="font-display text-xl font-bold text-kawaii-text">歌曲怎么打分</h2>
          <p className="text-sm text-kawaii-text/80 leading-relaxed">
            先用六维公开数据做加权：播放 15%、点赞 25%、投币 25%、收藏 20%、分享 10%、评论 5%。
            同样数量下，点赞和投币比纯播放更值钱。
          </p>
          <p className="text-sm text-kawaii-text/80 leading-relaxed">
            然后看互动率。播放超过 500 后，如果点赞率、投币率、收藏率明显偏低（常见于推荐位硬推、观众划走），播放分和对应互动分会按比例削减，最低留到四成。播放很少的新曲不判推流，避免误伤。
          </p>
          <p className="text-sm text-kawaii-text/80 leading-relaxed">
            评论数明显高于点赞、或评论率高得不像正常人气时，评论分也会打折。B 站弹幕数目前拿不到，所以刷弹幕还没法单独处理。
          </p>
          <p className="text-sm text-kawaii-muted leading-relaxed">
            排行榜用的是这套综合分。歌曲页雷达图是另一件事：把这首歌的六维和全站均值比，本周模式看增量，历史模式看累计。
          </p>
        </section>
      </div>
    </main>
  );
}
