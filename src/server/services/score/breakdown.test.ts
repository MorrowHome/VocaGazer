import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logProfile, meanAxes, normalizeRadar, scoreBreakdown } from './breakdown';

test('等量六维时加权分量等于权重×值', () => {
  const b = scoreBreakdown({
    playCount: 100,
    likes: 100,
    coins: 100,
    favorites: 100,
    shares: 100,
    comments: 100,
  });
  assert.equal(b.playCount, 15);
  assert.equal(b.likes, 25);
  assert.equal(b.comments, 5);
});

test('等于基底时雷达落在 50', () => {
  const v = { playCount: 10, likes: 20, coins: 20, favorites: 16, shares: 8, comments: 4 };
  const n = normalizeRadar(v, v);
  for (const k of Object.keys(n) as (keyof typeof n)[]) {
    assert.equal(n[k], 50);
  }
});

test('两倍图均为 65，不是顶满 100', () => {
  const base = { playCount: 10, likes: 10, coins: 10, favorites: 10, shares: 10, comments: 10 };
  const v = { playCount: 20, likes: 20, coins: 20, favorites: 20, shares: 20, comments: 20 };
  const n = normalizeRadar(v, base);
  assert.equal(Math.round(n.likes), 65);
});

test('相对图均倍数不同时形状会拉开', () => {
  const base = { playCount: 100, likes: 100, coins: 100, favorites: 100, shares: 100, comments: 100 };
  const v = { playCount: 200, likes: 800, coins: 100, favorites: 100, shares: 100, comments: 50 };
  const n = normalizeRadar(v, base);
  assert.ok(n.likes > n.playCount);
  assert.ok(n.playCount > n.comments);
});

test('meanAxes 求平均', () => {
  const m = meanAxes([
    { playCount: 0, likes: 10, coins: 0, favorites: 0, shares: 0, comments: 0 },
    { playCount: 0, likes: 30, coins: 0, favorites: 0, shares: 0, comments: 0 },
  ]);
  assert.equal(m.likes, 20);
});

test('logProfile 让播放远高于评论时形状拉开', () => {
  const p = logProfile({
    playCount: 8800,
    likes: 3100,
    coins: 685,
    favorites: 934,
    shares: 177,
    comments: 226,
  });
  assert.ok(p.playCount > p.comments);
  assert.ok(p.playCount > 80);
  assert.ok(p.comments < p.likes);
});
