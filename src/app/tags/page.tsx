'use client';

import { trpc } from '@/lib/trpc';
import { formatCount } from '@/lib/utils';

const TAG_COLORS: Record<string, string> = {
  初音未来: '#39C5BB',
  镜音铃: '#FF9B7A',
  镜音连: '#FF9B7A',
  巡音流歌: '#B8A0FF',
  洛天依: '#FF8BB8',
  言和: '#39C5BB',
  乐正绫: '#FF8BB8',
  乐正龙牙: '#39C5BB',
  徵羽摩柯: '#7DDBA3',
  墨清弦: '#B8A0FF',
  星尘: '#B8A0FF',
  心华: '#B8A0FF',
  赤羽: '#FF8BB8',
  苍穹: '#39C5BB',
  诗岸: '#7DDBA3',
  GUMI: '#B8A0FF',
  VOCALOID: '#FF8BB8',
};

function getTagColor(tag: string): string {
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (tag.includes(key)) return color;
  }
  return '#FF9B7A';
}

export default function TagsPage() {
  const { data, isLoading } = trpc.songs.getTags.useQuery({ limit: 100 });

  return (
    <main className="min-h-screen relative">


      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {isLoading ? (
          <div className="flex flex-wrap gap-3">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-full bg-kawaii-surface/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data?.map((t) => (
              <a
                key={t.tag}
                href={`/tag/${encodeURIComponent(t.tag)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-kawaii-void/70 border border-kawaii-border/40 hover:border-transparent hover:text-white transition-all text-sm font-bold shadow-sm"
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
