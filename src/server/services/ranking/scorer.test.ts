import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore } from './scorer';

test('权重与 SPEC 一致：投币/点赞高于播放', () => {
  const score = calculateScore({
    playCount: 100,
    likes: 100,
    coins: 100,
    favorites: 100,
    shares: 100,
    comments: 100,
  });
  assert.equal(score, 100);
});

test('播放量权重为 0.15', () => {
  const score = calculateScore({
    playCount: 1000,
    likes: 0,
    coins: 0,
    favorites: 0,
    shares: 0,
    comments: 0,
  });
  assert.equal(score, 60);
});

test('高播低赞会被削减', () => {
  const pushed = calculateScore({
    playCount: 20000,
    likes: 200,
    coins: 40,
    favorites: 60,
    shares: 20,
    comments: 30,
  });
  const organic = calculateScore({
    playCount: 20000,
    likes: 2400,
    coins: 600,
    favorites: 900,
    shares: 20,
    comments: 30,
  });
  assert.ok(organic > pushed * 1.5);
});

test('评论明显高于点赞时刷评分量打折', () => {
  const farmed = calculateScore({
    playCount: 2000,
    likes: 200,
    coins: 80,
    favorites: 100,
    shares: 20,
    comments: 400,
  });
  const normal = calculateScore({
    playCount: 2000,
    likes: 200,
    coins: 80,
    favorites: 100,
    shares: 20,
    comments: 40,
  });
  assert.ok(farmed < normal + 400 * 0.05);
});
