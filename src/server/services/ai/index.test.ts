import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectAnomalies } from './index';

test('高赞比会被标成异常', () => {
  const hits = detectAnomalies([
    { title: '测试曲', author: 'P', score: 10, plays: 2000, likes: 400 },
  ]);
  assert.equal(hits.length, 1);
  assert.match(hits[0].reason, /点赞率/);
});
