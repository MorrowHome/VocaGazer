import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashResetToken } from './mail';

test('重置令牌哈希稳定且非明文', () => {
  const a = hashResetToken('abc');
  const b = hashResetToken('abc');
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.notEqual(a, 'abc');
});
