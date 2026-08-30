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
