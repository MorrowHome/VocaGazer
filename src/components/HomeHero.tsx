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
  featured = false,
}: {
  href: string;
  kicker: string;
  title: string;
  author?: string;
  extra?: string;
  picUrl?: string | null;
  featured?: boolean;
}) {
  const img = coverImgProps(picUrl);
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ring-1 ring-white/15 hover:ring-kawaii-cyan/40 transition-all ${
        featured ? 'aspect-[21/10] min-h-[11rem]' : 'aspect-[16/10]'
      }`}
    >
      {img.src ? (
        <img
          {...img}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kawaii-pink/40 via-kawaii-purple/30 to-kawaii-cyan/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-kawaii-hero-void via-kawaii-hero-void/35 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-end p-4 md:p-5">
        <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-kawaii-cyan/90">{kicker}</p>
        <p className={`font-display font-bold text-white mt-1.5 line-clamp-2 leading-snug ${featured ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>
          {title}
        </p>
        {(author || extra) && (
          <p className="text-xs text-white/70 truncate mt-1.5">
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
          <img {...bg} alt="" className="w-full h-full object-cover scale-110 blur-[2px]" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-kawaii-pink/30 via-kawaii-surface to-kawaii-cyan/25" />
        )}
        <div className="hero-dim absolute inset-0 bg-gradient-to-t from-kawaii-hero-void via-kawaii-hero-void/70 to-kawaii-hero-void/30" />
        <div className="hero-dim absolute inset-0 bg-gradient-to-r from-kawaii-hero-void/80 via-transparent to-kawaii-hero-void/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 pt-28">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-end">
          <div>
            <p className="text-[11px] font-bold tracking-[0.42em] text-kawaii-cyan mb-5">VOCALOID HUB</p>
            <h1 className="home-hero-title font-display text-[2.6rem] sm:text-5xl md:text-6xl font-bold leading-[1.15] text-white">
              今夜，
              <br />
              <span className="text-gradient-flow">歌声盛开。</span>
            </h1>
            <p className="home-hero-sub mt-5 max-w-md text-sm md:text-base text-white/65 leading-relaxed">
              B 站虚拟歌手原创曲的排行、数据和讨论。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              {weeklyHot ? (
                <HeroCard
                  featured
                  href={`/song/${weeklyHot.bvId}`}
                  kicker="周榜第一"
                  title={weeklyHot.title}
                  author={weeklyHot.author}
                  extra={`★ ${Number(weeklyHot.score).toFixed(1)}`}
                  picUrl={weeklyHot.picUrl}
                />
              ) : (
                <HeroCard featured href="/ranking" kicker="周榜第一" title="暂无" />
              )}
            </div>
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
        </div>

        <a
          href="#hub-main"
          className="inline-flex items-center gap-3 mt-10 text-white/45 hover:text-kawaii-pink transition-colors"
          aria-label="往下看"
        >
          <span className="hero-scroll-hint w-px h-8 bg-gradient-to-b from-kawaii-pink to-transparent" aria-hidden="true" />
          <span className="text-[10px] tracking-[0.3em] font-bold">SCROLL</span>
        </a>
      </div>
    </section>
  );
}
