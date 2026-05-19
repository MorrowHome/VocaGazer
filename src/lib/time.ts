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
export function chinaDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}
