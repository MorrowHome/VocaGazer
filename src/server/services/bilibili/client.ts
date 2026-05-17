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

/**
 * 从一条 API 响应中提取视频列表
 */
function extractVideos(data: any): any[] {
  if (data.result?.video) {
    // /x/web-interface/search/all — result.video[]
    return data.result.video;
  }
  if (Array.isArray(data.result)) {
    // /x/web-interface/search/all/v2 — result[] (array of mixed types)
    return data.result.filter((item: any) => item.bvid);
  }
  if (data.videos) {
    return data.videos;
  }
  return [];
}

/**
 * 按关键词搜索单页视频
 */
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

      return videos.map((v: any) => ({
        bvid: v.bvid,
        title: v.title,
        author: v.author,
        pubdate: v.pubdate,
        description: v.description || '',
        tag: keyword,
      }));
    } catch {
      continue;
    }
  }

  return [];
}

/**
 * 按关键词搜索视频（多页）
 * 获取第 1 页和第 2 页的结果，提高召回率
 */
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
    if (videos.length < 20) break; // 不足一页说明没有更多了
    await delay(300);
  }

  return allVideos;
}

/**
 * 获取视频详情（播放量、点赞等统计数据）
 */
export async function getVideoDetail(bvid: string): Promise<BiliVideoDetail | null> {
  try {
    const res = await client.get('/x/web-interface/view', {
      params: { bvid },
    });

    if (res.data.code !== 0) return null;

    const d = res.data.data;
    return {
      aid: d.aid,
      bvid: d.bvid,
      title: d.title,
      author: d.owner?.name || '',
      authorAvatar: d.owner?.face || '',
      pubdate: d.pubdate,
      description: d.desc || '',
      duration: d.duration || 0,
      pic: d.pic || '',
      tags: (d.tags || []).map((t: any) => t.tag_name),
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

/**
 * 延时工具函数
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 获取视频热评（按点赞数排序取前 N 条）
 */
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
