'use client';

import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';

const TAG_COLORS: Record<string, string> = {
  初音未来: '#39BEB9',
  镜音铃: '#FFB08C',
  镜音连: '#FFB08C',
  巡音流歌: '#B388FF',
  洛天依: '#FF6B9D',
  言和: '#39BEB9',
  乐正绫: '#FF6B9D',
  乐正龙牙: '#39BEB9',
  徵羽摩柯: '#A8D14B',
  墨清弦: '#B388FF',
  星尘: '#B388FF',
  心华: '#B388FF',
  赤羽: '#FF6B9D',
  苍穹: '#39BEB9',
  诗岸: '#A8D14B',
  GUMI: '#B388FF',
  VOCALOID: '#FF6B9D',
};

function getTagColor(tag: string): string {
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (tag.includes(key)) return color;
  }
  return '#FFB08C';
}

export default function TagsPage() {
  const { data, isLoading } = trpc.songs.getTags.useQuery({ limit: 100 });

  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {isLoading ? (
          <div className="flex flex-wrap gap-3">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-full bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data?.map((t) => (
              <a
                key={t.tag}
                href={`/tag/${encodeURIComponent(t.tag)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-kawaii-border/40 hover:border-transparent hover:text-white transition-all text-sm font-bold shadow-sm"
                style={{
                  borderColor: `${getTagColor(t.tag)}40`,
                  color: getTagColor(t.tag),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = getTagColor(t.tag);
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = getTagColor(t.tag);
                }}
              >
                {t.tag}
                <span className="text-[11px] opacity-60 font-bold">{t.count}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
