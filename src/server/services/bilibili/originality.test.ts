import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeOriginality } from './crawler';

test('标题含原创则通过', () => {
  const r = judgeOriginality('【洛天依原创】夏日终末', '作曲编曲作词');
  assert.equal(r.isOriginal, true);
});

test('教程标题被硬排除', () => {
  const r = judgeOriginality('初音未来调教教程', '');
  assert.equal(r.isOriginal, false);
  assert.match(r.reason, /硬排除/);
});

test('过短时长排除', () => {
  const r = judgeOriginality('【初音未来】短片段', '作曲', 10);
  assert.equal(r.isOriginal, false);
});

test('初音ミク日文标题即使搜索摘要为空也通过', () => {
  const r = judgeOriginality(
    '【初音ミク】那片蓝色，最后会变成什么呢——《未来より》【bilibilionly同人扶持计划】',
    '',
  );
  assert.equal(r.isOriginal, true);
});
