export type DailySnap = {
  date: string | Date;
  playCount: number;
  likes?: number;
  coins?: number;
  favorites?: number;
  shares?: number;
  comments?: number;
  score?: number;
};

export type DailyPoint = {
  date: string;
  playCount: number;
  likes: number;
  coins: number;
  favorites: number;
  shares: number;
  comments: number;
  score: number;
  missing: boolean;
};

function dayKey(date: string | Date) {
  return typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
}

export function fillDailyGaps(rows: DailySnap[]): DailyPoint[] {
  if (rows.length === 0) return [];
  const byDay = new Map<string, DailyPoint>();
  for (const r of rows) {
    const key = dayKey(r.date);
    byDay.set(key, {
      date: key,
      playCount: r.playCount,
      likes: r.likes ?? 0,
      coins: r.coins ?? 0,
      favorites: r.favorites ?? 0,
      shares: r.shares ?? 0,
      comments: r.comments ?? 0,
      score: r.score ?? 0,
      missing: false,
    });
  }
  const keys = Array.from(byDay.keys()).sort();
  const start = new Date(keys[0]);
  const end = new Date(keys[keys.length - 1]);
  const out: DailyPoint[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push(
      hit ?? {
        date: key,
        playCount: 0,
        likes: 0,
        coins: 0,
        favorites: 0,
        shares: 0,
        comments: 0,
        score: 0,
        missing: true,
      },
    );
  }
  return out;
}

export function sliceRange(rows: DailyPoint[], range: '7d' | '30d' | '90d' | 'all'): DailyPoint[] {
  if (range === 'all' || rows.length === 0) return rows;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const last = rows[rows.length - 1].date;
  const from = new Date(last);
  from.setDate(from.getDate() - (days - 1));
  const fromKey = from.toISOString().slice(0, 10);
  return rows.filter((r) => r.date >= fromKey);
}

export function rateOf(num: number, den: number) {
  if (den <= 0) return 0;
  return num / den;
}

export function dailyDeltas(rows: DailyPoint[], key: keyof DailyPoint): Array<{ date: string; value: number; missing: boolean }> {
  return rows.map((d, i) => {
    const prev = rows[i - 1];
    const missing = d.missing || !prev || prev.missing;
    const raw = !missing ? Number(d[key]) - Number(prev[key]) : 0;
    return { date: d.date, value: Math.max(0, raw), missing };
  });
}
