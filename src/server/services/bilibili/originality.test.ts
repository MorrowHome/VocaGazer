import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeGrayBatch, judgeOriginality } from './originality';
import { stripHtml, parseDuration } from './client';

test('标题含原创则通过', () => {
  const r = judgeOriginality({
    title: '【洛天依原创】夏日终末',
    description: '作曲编曲作词',
  });
  assert.equal(r.decision, 'accept');
  assert.equal(r.isOriginal, true);
});

test('教程标题被硬排除', () => {
  const r = judgeOriginality({ title: '初音未来调教教程', description: '' });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /硬排除/);
});

test('过短时长排除', () => {
  const r = judgeOriginality({ title: '【初音未来】短片段', description: '作曲', duration: 10 });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /时长/);
});

test('初音ミク日文标题即使搜索摘要为空也通过', () => {
  const r = judgeOriginality({
    title: '【初音ミク】那片蓝色，最后会变成什么呢——《未来より》【bilibilionly同人扶持计划】',
    description: '',
  });
  assert.equal(r.decision, 'accept');
});

test('标题无歌姬但标签是 VOCALOID 原创曲则通过', () => {
  const r = judgeOriginality({
    title: '那片蓝色',
    description: '',
    tags: ['VOCALOID', '初音未来', '原创曲'],
  });
  assert.equal(r.decision, 'accept');
});

test('洛天依本家 PV 通过', () => {
  const r = judgeOriginality({
    title: '【洛天依】夜航星【PV】',
    description: '作曲：甲 编曲：乙 调教：丙',
  });
  assert.equal(r.decision, 'accept');
});

test('DiffSinger 本家通过', () => {
  const r = judgeOriginality({
    title: '【DiffSinger】潮汐',
    description: '作曲编曲作词',
  });
  assert.equal(r.decision, 'accept');
});

test('UTAU 本家通过', () => {
  const r = judgeOriginality({
    title: '【UTAU】重音テトオリジナル',
    description: '作曲 作詞',
  });
  assert.equal(r.decision, 'accept');
});

test('翻唱被硬排除', () => {
  const r = judgeOriginality({ title: '【初音未来】某曲翻唱', description: '' });
  assert.equal(r.decision, 'reject');
});

test('歌ってみた被硬排除', () => {
  const r = judgeOriginality({ title: '【初音ミク】夜に駆ける', description: '歌ってみた' });
  assert.equal(r.decision, 'reject');
});

test('RVC 翻唱被排除', () => {
  const r = judgeOriginality({
    title: '【初音未来】某曲',
    description: '使用 RVC 模型推理',
  });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /RVC|硬排除/);
});

test('so-vits 被排除', () => {
  const r = judgeOriginality({
    title: '星尘翻唱练习',
    description: 'so-vits-svc 训练记录',
  });
  assert.equal(r.decision, 'reject');
});

test('分区翻唱直接拒绝', () => {
  const r = judgeOriginality({
    title: '【初音未来】某曲',
    description: '作曲',
    tid: 31,
  });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /翻唱/);
});

test('转载 copyright=2 拒绝', () => {
  const r = judgeOriginality({
    title: '【初音ミク】オリジナル',
    description: '作曲',
    copyright: 2,
  });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /转载/);
});

test('MMD 加原创但无作曲拒绝', () => {
  const r = judgeOriginality({
    title: '【初音未来】原创MMD',
    description: '',
  });
  assert.equal(r.decision, 'reject');
});

test('真人原创星尘歧义不直接入库', () => {
  const r = judgeOriginality({
    title: '星尘下的旅行',
    description: '我唱的原创',
  });
  assert.notEqual(r.decision, 'accept');
});

test('flower 普通英文不误匹配', () => {
  const r = judgeOriginality({
    title: 'sunflower field',
    description: 'original song',
  });
  assert.equal(r.decision, 'reject');
});

test('VOCALOID 分区自制但无曲名无作曲时进灰区，不直接入库', () => {
  const r = judgeOriginality({
    title: '夜色回廊',
    description: '',
    tid: 193,
    tname: 'VOCALOID',
    copyright: 1,
    duration: 210,
  });
  assert.equal(r.decision, 'gray');
});

test('标签 VOCALOID 不能当成作曲信息', () => {
  const r = judgeOriginality({
    title: '突破次元，超梦初音！19周年！【bilibilionly同人扶持计划】',
    description: '',
    tags: ['VOCALOID', '初音未来', 'bilibilionly同人扶持计划'],
    tid: 193,
    copyright: 1,
    duration: 180,
  });
  assert.equal(r.decision, 'reject');
  assert.match(r.reason, /周年|生贺|应援/);
});

test('COS 宅舞翻跳已有名曲不入库', () => {
  const r = judgeOriginality({
    title: '这个视频，送给被生命厌恶着的我们。| 被生命所厌恶。(命に嫌われている。)【bilibilionly同人扶持计划】',
    description: '',
    tags: ['VOCALOID', '初音未来', '舞蹈', 'COS'],
    tid: 20,
    copyright: 1,
    duration: 240,
  });
  assert.equal(r.decision, 'reject');
});

test('有曲名的周年纪念曲仍可过', () => {
  const r = judgeOriginality({
    title: '【初音未来17周年】《New Connection》',
    description: '作曲：甲 作词：乙 调教：丙',
  });
  assert.equal(r.decision, 'accept');
});

test('灰区无模型则不入库', async () => {
  const out = await judgeGrayBatch([
    { bvId: 'BV1xx', title: '待确认', reason: '原创证据不足' },
  ]);
  assert.equal(out[0].accept, false);
  assert.match(out[0].reason, /未配置|不入库/);
});

test('灰区只在注入模型时调用且解析失败视为拒绝', async () => {
  let called = 0;
  const out = await judgeGrayBatch(
    [{ bvId: 'BV1aa', title: '灰', reason: '待确认' }],
    async () => {
      called += 1;
      return 'not-json';
    },
  );
  assert.equal(called, 1);
  assert.equal(out[0].accept, false);
});

test('灰区解析 JSON 数组', async () => {
  const out = await judgeGrayBatch(
    [{ bvId: 'BV1ok', title: '曲', reason: '待确认' }],
    async () => JSON.stringify([{ bvId: 'BV1ok', accept: true, reason: '本家' }]),
  );
  assert.equal(out[0].accept, true);
});

test('搜索标题去掉 em 标签', () => {
  assert.equal(stripHtml('【<em class="keyword">初音ミク</em>】夜歌'), '【初音ミク】夜歌');
});

test('解析搜索时长', () => {
  assert.equal(parseDuration('3:21'), 201);
  assert.equal(parseDuration(180), 180);
});
