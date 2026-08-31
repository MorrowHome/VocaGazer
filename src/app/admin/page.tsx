'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/components/AuthContext';
import { coverImgProps } from '@/lib/utils';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const status = trpc.crawl.status.useQuery(undefined, {
    enabled: user?.role === 'admin',
    refetchInterval: 3000,
  });
  const posts = trpc.posts.getLatest.useQuery(
    { page: 1, limit: 15, sort: 'latest' },
    { enabled: user?.role === 'admin' },
  );
  const trigger = trpc.crawl.trigger.useMutation({
    onSuccess: () => utils.crawl.status.invalidate(),
  });
  const ranks = trpc.crawl.generateRanks.useMutation();
  const ai = trpc.crawl.generateAi.useMutation({
    onSuccess: () => utils.ai.getLatestBundle.invalidate(),
  });
  const pin = trpc.posts.pin.useMutation({
    onSuccess: () => utils.posts.getLatest.invalidate(),
  });

  if (authLoading) {
    return (
      <main className="min-h-screen relative">
        <p className="max-w-3xl mx-auto px-4 py-16 text-kawaii-muted font-medium">加载中…</p>
      </main>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <main className="min-h-screen relative">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <p className="text-kawaii-muted font-medium">需要管理员账号才能进入此页。</p>
        </div>
      </main>
    );
  }

  const crawlBusy =
    trigger.isLoading ||
    status.data?.currentJob === 'crawl' ||
    status.data?.crawlJob?.status === 'queued' ||
    status.data?.crawlJob?.status === 'running';
  const crawlJob = status.data?.crawlJob;

  return (
    <main className="min-h-screen relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        <h1 className="text-lg font-black tracking-wide text-gradient-flow">管理台</h1>

        <section className="card !p-6 space-y-4">
          <h2 className="text-sm font-black text-kawaii-text">采集与排行</h2>
          <p className="text-xs text-kawaii-muted font-medium">
            上次采集：{status.data?.last_crawl_time || '未知'} · 开关：{status.data?.crawl_enabled ?? '—'}
            {status.data?.currentJob ? ` · 正在运行 ${status.data.currentJob}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-pink !py-1.5 !px-4 text-xs"
              disabled={crawlBusy}
              onClick={() => trigger.mutate({ withinHours: 72 })}
            >
              {crawlBusy ? '采集中…' : '触发采集'}
            </button>
            <button
              type="button"
              className="btn btn-cyan !py-1.5 !px-4 text-xs"
              disabled={ranks.isLoading}
              onClick={() => ranks.mutate()}
            >
              {ranks.isLoading ? '生成中…' : '生成排行榜'}
            </button>
            <button
              type="button"
              className="btn btn-ghost !py-1.5 !px-4 text-xs"
              disabled={ai.isLoading}
              onClick={() => ai.mutate({ force: true })}
            >
              {ai.isLoading ? '生成中…' : '生成 AI 报告'}
            </button>
          </div>
          {crawlJob?.status === 'queued' && (
            <p className="text-xs text-kawaii-muted">采集已在后台排队，搜标签会跑几分钟，请留在此页等待结果。</p>
          )}
          {crawlJob?.status === 'running' && (
            <p className="text-xs text-kawaii-muted">正在采集（后台执行，不会被页面超时打断）…</p>
          )}
          {crawlJob?.status === 'ok' && (
            <p className="text-xs text-kawaii-muted">采集完成：入库 {crawlJob.savedCount ?? 0} 首</p>
          )}
          {crawlJob?.status === 'skipped' && (
            <p className="text-xs text-kawaii-muted">采集已跳过（开关关闭）</p>
          )}
          {crawlJob?.status === 'error' && (
            <p className="text-xs text-kawaii-pink">采集失败：{crawlJob.message || '未知错误'}</p>
          )}
          {ranks.data && (
            <p className="text-xs text-kawaii-muted">排行：日 {ranks.data.daily} / 周 {ranks.data.weekly} / 总 {ranks.data.alltime}</p>
          )}
          {ai.data && <p className="text-xs text-kawaii-muted">AI 报告已写入（管理台会覆盖当日旧稿，定时任务仍去重）</p>}
          {(trigger.error || ranks.error || ai.error) && (
            <p className="text-xs text-kawaii-pink">{trigger.error?.message || ranks.error?.message || ai.error?.message}</p>
          )}
        </section>

        <section className="card !p-6 space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">编者推送</h2>
          <EditorPicksAdmin />
        </section>

        <section className="card !p-6 space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">雨幕封面</h2>
          <HeroImageAdmin />
        </section>
        <section className="card !p-6 space-y-3">
          <h2 className="text-sm font-black text-kawaii-text">帖子置顶</h2>
          {posts.data?.posts.map((post) => (
            <div key={post.id} className="flex items-center gap-3 text-sm">
              <a href={`/forum/post/${post.id}`} className="flex-1 truncate font-bold text-kawaii-text hover:text-kawaii-pink">
                {post.isPinned ? '◆ ' : ''}{post.title}
              </a>
              <button
                type="button"
                className="text-xs font-bold text-kawaii-muted hover:text-kawaii-pink"
                onClick={() => pin.mutate({ id: post.id, isPinned: !post.isPinned })}
              >
                {post.isPinned ? '取消置顶' : '置顶'}
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function EditorPicksAdmin() {
  const utils = trpc.useUtils();
  const { data } = trpc.picks.list.useQuery();
  const add = trpc.picks.add.useMutation({ onSuccess: () => utils.picks.list.invalidate() });
  const remove = trpc.picks.remove.useMutation({ onSuccess: () => utils.picks.list.invalidate() });
  return (
    <div className="space-y-3">
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const bvId = (form.elements.namedItem('bvId') as HTMLInputElement).value.trim();
          const note = (form.elements.namedItem('note') as HTMLInputElement).value.trim();
          if (!bvId) return;
          add.mutate({ bvId, note });
          form.reset();
        }}
      >
        <input name="bvId" placeholder="BV 号或标题" className="flex-1 text-xs" />
        <input name="note" placeholder="编者短评（可选）" className="flex-1 text-xs" />
        <button type="submit" className="btn btn-pink !py-1.5 !px-4 text-xs" disabled={add.isLoading}>
          {add.isLoading ? '添加中…' : '推送'}
        </button>
      </form>
      {add.error && <p className="text-xs text-kawaii-pink">{add.error.message}</p>}
      <div className="space-y-2">
        {data?.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-xs">
            <span className="text-kawaii-muted font-bold w-6">{p.sortOrder}</span>
            <a href={`/song/${p.song.bvId}`} className="flex-1 truncate font-bold hover:text-kawaii-pink">
              {p.song.title}
            </a>
            <button type="button" className="text-kawaii-muted hover:text-kawaii-pink" onClick={() => remove.mutate(p.id)}>
              下架
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroImageAdmin() {
  const utils = trpc.useUtils();
  const scene = trpc.picks.scene.useQuery();
  const setScene = trpc.picks.setHeroScene.useMutation({
    onSuccess: (next) => {
      utils.picks.scene.setData(undefined, next);
      utils.analytics.getHomepage.invalidate();
    },
  });
  const [q, setQ] = useState('');
  const [url, setUrl] = useState('');
  const search = trpc.songs.search.useQuery(
    { q: q.trim(), limit: 8 },
    { enabled: q.trim().length >= 2 },
  );

  const sourceLabel =
    scene.data?.source === 'song'
      ? `指定歌曲：${scene.data.songTitle || scene.data.songBvId}`
      : scene.data?.source === 'url'
        ? '指定图片 URL'
        : scene.data?.source === 'weekly'
          ? `周榜第一：${scene.data.weeklyTitle || '暂无'}`
          : '默认底图';
  const preview = coverImgProps(scene.data?.activeUrl);

  return (
    <div className="space-y-3">
      <p className="text-xs text-kawaii-muted font-medium">当前：{sourceLabel}</p>
      {preview.src ? (
        <img {...preview} alt="" className="w-full h-28 object-cover rounded-xl ring-1 ring-kawaii-border/40" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost !py-1.5 !px-4 text-xs"
          disabled={setScene.isLoading}
          onClick={() => setScene.mutate({ mode: 'weekly' })}
        >
          使用周榜封面
        </button>
      </div>
      <div className="space-y-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜库内歌曲（BV 号或标题）"
          className="w-full text-xs"
        />
        {search.data?.songs?.length ? (
          <div className="space-y-1">
            {search.data.songs.map((song) => (
              <button
                key={song.bvId}
                type="button"
                className="w-full text-left text-xs px-3 py-2 rounded-xl bg-kawaii-void/50 hover:bg-kawaii-void/80 truncate"
                onClick={() => {
                  setScene.mutate({ mode: 'song', q: song.bvId });
                  setQ('');
                }}
              >
                {song.title} · {song.author}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          setScene.mutate({ mode: 'url', url: url.trim() });
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="或直接填封面图 URL"
          className="flex-1 text-xs"
        />
        <button type="submit" className="btn btn-ghost !py-1.5 !px-4 text-xs" disabled={setScene.isLoading}>
          保存 URL
        </button>
      </form>
      {setScene.error && <p className="text-xs text-kawaii-pink">{setScene.error.message}</p>}
    </div>
  );
}
