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
  assert.equal(score, 150);
});
