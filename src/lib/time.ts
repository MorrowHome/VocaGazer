/**
 * China timezone (UTC+8) date utilities
 * Server may be in any timezone; all site operations need China calendar days.
 */

/**
 * Return the UTC Date representing midnight in China timezone for the given date.
 * Always yields a UTC Date whose calendar date in Asia/Shanghai is the intended day.
 *
 * Example: if it's 11pm LA time on May 18, China time is 2pm May 19 →
 *   chinaDateKey() returns `2026-05-19T00:00:00.000Z`
 */
export function chinaDateKey(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const chinaStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const [y, m, day] = chinaStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

/**
 * Format a UTC Date as YYYY-MM-DD in China timezone.
 */
export function chinaDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

/**
 * 中国日历日的真实时间范围 [start, end)，以及用于 Ranking.date 的快照键
 * （UTC 零点，与历史快照存储格式兼容）。
 */
export function chinaCalendarDay(date: Date = new Date()): {
  start: Date;
  end: Date;
  snapDate: Date;
  key: string;
} {
  const key = chinaDateStr(date);
  const start = new Date(`${key}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, snapDate: chinaDateKey(date), key };
}

/** 中国时区下偏移若干天（正负均可） */
export function shiftChinaDays(date: Date, days: number): Date {
  const noon = new Date(`${chinaDateStr(date)}T12:00:00+08:00`);
  return new Date(noon.getTime() + days * 24 * 60 * 60 * 1000);
}

/** 中国日历下该日是周几：1=周一 … 7=周日 */
export function chinaWeekday(date: Date = new Date()): number {
  const snap = chinaDateKey(date);
  const utcDay = snap.getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

/** 中国自然周（周一起）：[start, end) 以及 Ranking.date 用的周一 snapDate */
export function chinaWeekRange(date: Date = new Date()): {
  start: Date;
  end: Date;
  snapDate: Date;
  key: string;
} {
  const monday = shiftChinaDays(date, -(chinaWeekday(date) - 1));
  const weekStart = chinaCalendarDay(monday);
  const nextMon = chinaCalendarDay(shiftChinaDays(monday, 7));
  return {
    start: weekStart.start,
    end: nextMon.start,
    snapDate: weekStart.snapDate,
    key: weekStart.key,
  };
}

/** 中国自然月：[当月 1 日 00:00, 次月 1 日 00:00) */
export function chinaMonthRange(date: Date = new Date()): {
  start: Date;
  end: Date;
  snapDate: Date;
  key: string;
} {
  const [y, m] = chinaDateStr(date).split('-').map(Number);
  const key = `${y}-${String(m).padStart(2, '0')}-01`;
  const start = new Date(`${key}T00:00:00+08:00`);
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? y + 1 : y;
  const endKey = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  const end = new Date(`${endKey}T00:00:00+08:00`);
  return { start, end, snapDate: chinaDateKey(start), key: key.slice(0, 7) };
}

/** 中国自然年 */
export function chinaYearRange(date: Date = new Date()): {
  start: Date;
  end: Date;
  snapDate: Date;
  key: string;
} {
  const y = Number(chinaDateStr(date).slice(0, 4));
  const start = new Date(`${y}-01-01T00:00:00+08:00`);
  const end = new Date(`${y + 1}-01-01T00:00:00+08:00`);
  return { start, end, snapDate: chinaDateKey(start), key: String(y) };
}

/** 中国日历 ISO 周字符串，如 2026-W36 */
export function chinaISOWeek(date: Date = new Date()): string {
  const week = chinaWeekRange(date);
  const thursday = shiftChinaDays(week.snapDate, 3);
  const y = Number(chinaDateStr(thursday).slice(0, 4));
  const jan4 = new Date(`${y}-01-04T12:00:00+08:00`);
  const week1 = chinaWeekRange(jan4);
  const weekNo = Math.round((week.snapDate.getTime() - week1.snapDate.getTime()) / (7 * 86400000)) + 1;
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
}

/** 解析 2026-W36 → 该自然周范围 */
export function parseChinaISOWeek(iso: string): { start: Date; end: Date; snapDate: Date } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const w = Number(match[2]);
  if (w < 1 || w > 53) return null;
  const jan4 = new Date(`${y}-01-04T12:00:00+08:00`);
  const week1 = chinaWeekRange(jan4);
  const monday = shiftChinaDays(week1.snapDate, (w - 1) * 7);
  return chinaWeekRange(monday);
}
