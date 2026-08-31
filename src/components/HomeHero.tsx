'use client';

import Link from 'next/link';
import { coverImgProps, formatCount, parseStats } from '@/lib/utils';

function HeroCard({
  href,
  kicker,
  title,
  author,
  extra,
  picUrl,
}: {
  href: string;
  kicker: string;
  title: string;
  author?: string;
  extra?: string;
  picUrl?: string | null;
}) {
  const img = coverImgProps(picUrl);
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl aspect-[16/10] ring-1 ring-white/20 hover:ring-white/50 transition-all"
    >
      {img.src ? (
        <img
          {...img}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kawaii-pink/50 via-kawaii-purple/40 to-kawaii-cyan/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">{kicker}</p>
        <p className="text-sm md:text-base font-black text-white mt-1 line-clamp-2 leading-snug drop-shadow">
          {title}
        </p>
        {(author || extra) && (
          <p className="text-xs text-white/75 truncate mt-1">
            {author}
            {extra ? ` · ${extra}` : ''}
          </p>
        )}
      </div>
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
  const bg = coverImgProps(heroImageUrl || weeklyHot?.picUrl || dailyHot?.picUrl);
  const risingStats = rising ? parseStats(rising.statistics) : null;

  return (
    <section className="relative min-h-[100svh] -mt-14 flex items-end overflow-hidden">
      <div className="absolute inset-0">
        {bg.src ? (
          <img {...bg} alt="" className="w-full h-full object-cover scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kawaii-pink/40 via-kawaii-purple/30 to-kawaii-cyan/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1424] via-[#1a1424]/55 to-[#1a1424]/20" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 pt-28 space-y-8">
        <h1 className="sr-only">VOCALOID Hub</h1>
        <div className="grid sm:grid-cols-3 gap-3 max-w-4xl">
          {weeklyHot ? (
            <HeroCard
              href={`/song/${weeklyHot.bvId}`}
              kicker="周榜第一"
              title={weeklyHot.title}
              author={weeklyHot.author}
              extra={`★ ${Number(weeklyHot.score).toFixed(1)}`}
              picUrl={weeklyHot.picUrl}
            />
          ) : (
            <HeroCard href="/ranking" kicker="周榜第一" title="暂无" />
          )}
          {dailyHot ? (
            <HeroCard
              href={`/song/${dailyHot.bvId}`}
              kicker="日榜第一"
              title={dailyHot.title}
              author={dailyHot.author}
              extra={`★ ${Number(dailyHot.score).toFixed(1)}`}
              picUrl={dailyHot.picUrl}
            />
          ) : (
            <HeroCard href="/ranking" kicker="日榜第一" title="暂无" />
          )}
          {rising ? (
            <HeroCard
              href={`/song/${rising.bvId}`}
              kicker="分数飙升"
              title={rising.title}
              author={rising.author}
              extra={rising.scoreDelta ? `+${Number(rising.scoreDelta).toFixed(1)}` : formatCount(risingStats?.playCount ?? 0)}
              picUrl={rising.picUrl}
            />
          ) : (
            <HeroCard href="/ranking" kicker="分数飙升" title="暂无" />
          )}
        </div>

        <a
          href="#hub-main"
          className="inline-flex items-center text-white/50 hover:text-white"
          aria-label="往下看"
        >
          <span aria-hidden="true" className="hero-scroll-hint text-lg">↓</span>
        </a>
      </div>
    </section>
  );
}
