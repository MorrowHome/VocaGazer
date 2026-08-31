import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashResetToken, resolveSmtpFrom } from './mail';

test('重置令牌哈希稳定且非明文', () => {
  const a = hashResetToken('abc');
  const b = hashResetToken('abc');
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.notEqual(a, 'abc');
});

test('From 与 SMTP 登录邮箱不一致时改回登录邮箱', () => {
  assert.equal(
    resolveSmtpFrom('123456789@qq.com', 'VOCALOID Hub <other@qq.com>'),
    'VOCALOID Hub <123456789@qq.com>',
  );
  assert.equal(
    resolveSmtpFrom('you@qq.com', 'VOCALOID Hub <you@qq.com>'),
    'VOCALOID Hub <you@qq.com>',
  );
  assert.equal(resolveSmtpFrom('you@qq.com'), 'you@qq.com');
});
