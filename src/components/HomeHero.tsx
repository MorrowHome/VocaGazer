'use client';

import Link from 'next/link';
import { Typewriter } from '@/components/motion/Typewriter';
import { coverImgProps, formatCount, parseStats } from '@/lib/utils';

function HeroCard({
  href,
  kicker,
  title,
  author,
  extra,
}: {
  href: string;
  kicker: string;
  title: string;
  author?: string;
  extra?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 px-4 py-3 hover:bg-white/25 transition-colors"
    >
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">{kicker}</p>
      <p className="text-sm md:text-base font-black text-white truncate mt-0.5">{title}</p>
      {(author || extra) && (
        <p className="text-xs text-white/70 truncate mt-0.5">
          {author}
          {extra ? ` · ${extra}` : ''}
        </p>
      )}
    </Link>
  );
}

export function HomeHero({
  heroImageUrl,
  weeklyHot,
  dailyHot,
  rising,
}: {
  heroImageUrl?: string | null;
  weeklyHot?: any;
  dailyHot?: any;
  rising?: any;
}) {
  const img = coverImgProps(heroImageUrl);
  const risingStats = rising ? parseStats(rising.statistics) : null;

  return (
    <section className="relative min-h-[100svh] -mt-14 flex items-end overflow-hidden">
      <div className="absolute inset-0">
        {img.src ? (
          <img {...img} alt="" className="w-full h-full object-cover scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kawaii-pink/40 via-kawaii-purple/30 to-kawaii-cyan/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a2038]/90 via-[#2a2038]/45 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 pt-28 space-y-8">
        <div>
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/70 mb-3">VOCALOID Music Hub</p>
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg leading-tight">
            <Typewriter text="听一首会发光的歌" />
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/80 font-medium max-w-xl">
            日榜、周榜、飙升——把最重要的三首歌放在门口。
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl">
          {weeklyHot ? (
            <HeroCard
              href={`/song/${weeklyHot.bvId}`}
              kicker="周榜第一"
              title={weeklyHot.title}
              author={weeklyHot.author}
              extra={`★ ${Number(weeklyHot.score).toFixed(1)}`}
            />
          ) : (
            <HeroCard href="/ranking" kicker="周榜第一" title="采集后生成" />
          )}
          {dailyHot ? (
            <HeroCard
              href={`/song/${dailyHot.bvId}`}
              kicker="日榜第一"
              title={dailyHot.title}
              author={dailyHot.author}
              extra={`★ ${Number(dailyHot.score).toFixed(1)}`}
            />
          ) : (
            <HeroCard href="/ranking" kicker="日榜第一" title="采集后生成" />
          )}
          {rising ? (
            <HeroCard
              href={`/song/${rising.bvId}`}
              kicker="分数飙升"
              title={rising.title}
              author={rising.author}
              extra={rising.scoreDelta ? `+${Number(rising.scoreDelta).toFixed(1)}` : formatCount(risingStats?.playCount ?? 0)}
            />
          ) : (
            <HeroCard href="/ranking" kicker="分数飙升" title="待日快照对比" />
          )}
        </div>

        <a
          href="#hub-main"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white"
        >
          向下进入站点
          <span aria-hidden="true" className="hero-scroll-hint">↓</span>
        </a>
      </div>
    </section>
  );
}
