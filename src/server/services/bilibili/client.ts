/**
 * Bilibili API 客户端
 * 封装与 B 站 API 的通信
 */
import axios from 'axios';
import type { BiliSearchVideo, BiliVideoDetail } from './types';

const API_BASE = 'https://api.bilibili.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'User-Agent': UA,
    Referer: 'https://www.bilibili.com',
  },
});

export function stripHtml(s: string): string {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function parseDuration(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return 0;
  const t = raw.trim();
  const clock = t.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (clock) {
    if (clock[3]) return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
    return Number(clock[1]) * 60 + Number(clock[2]);
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function splitTagString(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => stripHtml(String(t))).filter(Boolean);
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return stripHtml(raw)
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapSearchHit(v: any, keyword: string): BiliSearchVideo {
  const tags = splitTagString(v.tag);
  return {
    bvid: v.bvid,
    title: stripHtml(v.title || ''),
    author: v.author || v.owner?.name || '',
    pubdate: v.pubdate || v.ctime || 0,
    description: stripHtml(v.description || v.desc || ''),
    tag: keyword,
    tags,
    duration: parseDuration(v.duration),
    tid: Number(v.typeid || v.tid || 0) || undefined,
    tname: v.typename || v.tname || undefined,
    copyright: Number(v.copyright || 0) || undefined,
  };
}

function mapArchive(a: any, keyword: string): BiliSearchVideo {
  return {
    bvid: a.bvid,
    title: stripHtml(a.title || ''),
    author: a.owner?.name || '',
    pubdate: a.pubdate || 0,
    description: stripHtml(a.desc || ''),
    tag: keyword,
    tags: [],
    duration: parseDuration(a.duration),
    tid: Number(a.tid || 0) || undefined,
    tname: a.tname || undefined,
    copyright: Number(a.copyright || 0) || undefined,
  };
}

function extractVideos(data: any): any[] {
  if (data.result?.video) {
    return data.result.video;
  }
  if (Array.isArray(data.result)) {
    return data.result.filter((item: any) => item.bvid);
  }
  if (data.videos) {
    return data.videos;
  }
  return [];
}

async function searchPage(
  keyword: string,
  page: number = 1,
): Promise<BiliSearchVideo[]> {
  const endpoints = [
    { path: '/x/web-interface/search/all', params: { search_type: 'video' } },
    { path: '/x/web-interface/search/all/v2', params: {} },
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep.path, {
        params: { keyword, page, order: 'pubdate', ...ep.params },
      });

      if (res.data.code !== 0) continue;

      const videos = extractVideos(res.data.data);
      if (videos.length === 0) continue;

      return videos.map((v: any) => mapSearchHit(v, keyword));
    } catch {
      continue;
    }
  }

  return [];
}

export async function searchByKeyword(
  keyword: string,
  maxPages: number = 2,
): Promise<BiliSearchVideo[]> {
  const allVideos: BiliSearchVideo[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const videos = await searchPage(keyword, page);
    for (const v of videos) {
      if (!seen.has(v.bvid)) {
        seen.add(v.bvid);
        allVideos.push(v);
      }
    }
    if (videos.length < 20) break;
    await delay(300);
  }

  return allVideos;
}

export async function listVocaloidPartition(
  pages: number = 2,
): Promise<BiliSearchVideo[]> {
  const allVideos: BiliSearchVideo[] = [];
  const seen = new Set<string>();

  for (let pn = 1; pn <= pages; pn++) {
    try {
      const res = await client.get('/x/web-interface/newlist', {
        params: { rid: 193, ps: 50, pn },
      });
      if (res.data.code !== 0) break;
      const archives = res.data.data?.archives || [];
      for (const a of archives) {
        if (!a?.bvid || seen.has(a.bvid)) continue;
        seen.add(a.bvid);
        allVideos.push(mapArchive(a, 'VOCALOID分区'));
      }
      if (archives.length < 50) break;
    } catch {
      break;
    }
    await delay(300);
  }

  return allVideos;
}

async function getArchiveTags(aid: number): Promise<string[]> {
  try {
    const res = await client.get('/x/tag/archive/tags', { params: { aid } });
    if (res.data.code !== 0) return [];
    const list = res.data.data;
    if (!Array.isArray(list)) return [];
    return list.map((t: any) => t.tag_name).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getVideoDetail(bvid: string): Promise<BiliVideoDetail | null> {
  try {
    const res = await client.get('/x/web-interface/view', {
      params: { bvid },
    });

    if (res.data.code !== 0) return null;

    const d = res.data.data;
    let tags = (d.tags || []).map((t: any) => t.tag_name).filter(Boolean);
    if (tags.length === 0 && d.aid) {
      tags = await getArchiveTags(d.aid);
    }

    return {
      aid: d.aid,
      bvid: d.bvid,
      title: stripHtml(d.title || ''),
      author: d.owner?.name || '',
      authorAvatar: d.owner?.face || '',
      pubdate: d.pubdate,
      description: d.desc || '',
      duration: d.duration || 0,
      pic: d.pic || '',
      tags,
      copyright: Number(d.copyright || 0) || undefined,
      tid: Number(d.tid || 0) || undefined,
      tname: d.tname || undefined,
      statistics: {
        view: d.stat?.view || 0,
        like: d.stat?.like || 0,
        coin: d.stat?.coin || 0,
        favorite: d.stat?.favorite || 0,
        share: d.stat?.share || 0,
        reply: d.stat?.reply || 0,
      },
    };
  } catch {
    return null;
  }
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getVideoComments(
  aid: number,
  limit: number = 3,
): Promise<import('./types').HotCommentsResult> {
  try {
    const res = await client.get('/x/v2/reply', {
      params: { type: 1, oid: aid, sort: 2, ps: limit },
    });

    if (res.data.code !== 0) {
      return { comments: [], total: 0 };
    }

    const replies = res.data.data?.replies || [];
    return {
      comments: replies.map((r: any) => ({
        mid: r.mid,
        uname: r.member?.uname || '匿名',
        content: r.content?.message || '',
        likes: r.like || 0,
        rpid: r.rpid,
        avatar: r.member?.avatar || '',
        ctime: r.ctime ? new Date(r.ctime * 1000).toISOString() : '',
      })),
      total: res.data.data?.page?.acount || 0,
    };
  } catch {
    return { comments: [], total: 0 };
  }
}
