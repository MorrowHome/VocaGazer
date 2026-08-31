import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyDeltas, fillDailyGaps, rateOf, sliceRange } from './daily-series';

test('fillDailyGaps 补上中间缺的天', () => {
  const rows = fillDailyGaps([
    { date: '2026-01-01', playCount: 10, likes: 1, coins: 0, favorites: 0, shares: 0, comments: 0, score: 1 },
    { date: '2026-01-03', playCount: 30, likes: 3, coins: 1, favorites: 1, shares: 0, comments: 0, score: 2 },
  ]);
  assert.equal(rows.length, 3);
  assert.equal(rows[1].missing, true);
  assert.equal(rows[2].playCount, 30);
});

test('dailyDeltas 用相邻快照算增量', () => {
  const rows = fillDailyGaps([
    { date: '2026-01-01', playCount: 10, likes: 1 },
    { date: '2026-01-02', playCount: 25, likes: 4 },
  ]);
  const d = dailyDeltas(rows, 'playCount');
  assert.equal(d[1].value, 15);
});

test('sliceRange 只留窗口内', () => {
  const rows = fillDailyGaps([
    { date: '2026-01-01', playCount: 1 },
    { date: '2026-01-20', playCount: 2 },
    { date: '2026-01-31', playCount: 3 },
  ]);
  const week = sliceRange(rows, '7d');
  assert.ok(week[0].date >= '2026-01-25');
  assert.equal(week[week.length - 1].date, '2026-01-31');
});

test('rateOf 播放为 0 时是 0', () => {
  assert.equal(rateOf(10, 0), 0);
  assert.equal(rateOf(8, 100), 0.08);
});
