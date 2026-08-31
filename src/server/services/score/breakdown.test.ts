import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  axisDelta,
  logProfile,
  meanAxes,
  meanRatesFromAxes,
  normalizeAgainstMean,
  normalizeRadar,
  RATE_AXES,
  ratesFromAxes,
  scoreBreakdown,
} from './breakdown';

test('axisDelta 用本周累计减上周快照得到增量', () => {
  const d = axisDelta(
    { playCount: 120, likes: 40, coins: 10, favorites: 8, shares: 2, comments: 5 },
    { playCount: 100, likes: 30, coins: 8, favorites: 6, shares: 1, comments: 4 },
  );
  assert.equal(d.playCount, 20);
  assert.equal(d.likes, 10);
});

test('ratesFromAxes 用播放做分母', () => {
  const r = ratesFromAxes({
    playCount: 1000,
    likes: 80,
    coins: 20,
    favorites: 30,
    shares: 10,
    comments: 5,
  });
  assert.equal(r.likeRate, 0.08);
  assert.equal(r.coinRate, 0.02);
  assert.equal(r.favRate, 0.03);
  assert.equal(r.coinLikeRate, 0.25);
});

test('高播低赞时点赞率远低于图均', () => {
  const pushed = ratesFromAxes({
    playCount: 10000,
    likes: 40,
    coins: 8,
    favorites: 12,
    shares: 4,
    comments: 2,
  });
  const mean = meanRatesFromAxes([
    { playCount: 1000, likes: 80, coins: 20, favorites: 30, shares: 10, comments: 5 },
    { playCount: 2000, likes: 160, coins: 40, favorites: 60, shares: 20, comments: 10 },
  ]);
  const n = normalizeAgainstMean(pushed, mean, RATE_AXES);
  assert.ok(n.likeRate < 50);
  assert.ok(n.coinRate < 50);
});

test('播放为 0 的歌不拉低互动率均值', () => {
  const m = meanRatesFromAxes([
    { playCount: 1000, likes: 100, coins: 20, favorites: 30, shares: 10, comments: 5 },
    { playCount: 0, likes: 0, coins: 0, favorites: 0, shares: 0, comments: 0 },
  ]);
  assert.equal(m.likeRate, 0.1);
});

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

test('远高于图均时雷达可以越出 100', () => {
  const base = { playCount: 10, likes: 10, coins: 10, favorites: 10, shares: 10, comments: 10 };
  const v = { playCount: 160, likes: 160, coins: 160, favorites: 160, shares: 160, comments: 160 };
  const n = normalizeRadar(v, base);
  assert.ok(n.likes > 100);
  assert.ok(n.likes <= 160);
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

