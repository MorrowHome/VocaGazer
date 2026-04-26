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
 * 按关键词搜索视频
 * 尝试多个搜索端点，直到成功
 */
export async function searchByKeyword(keyword: string): Promise<BiliSearchVideo[]> {
  const endpoints = [
    '/x/web-interface/search/all',      // stable: result.video[]
    '/x/web-interface/search/all/v2',    // alt: result[] (array directly)
    '/x/search/type',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await client.get(endpoint, {
        params: {
          keyword,
          search_type: 'video',
          page: 1,
          order: 'pubdate',
        },
      });

      if (res.data.code !== 0) continue;

      const data = res.data.data;

      // 尝试多种返回格式
      let videos: any[] = [];
      if (data.result?.video) {
        // /x/web-interface/search/all — result.video[]
        videos = data.result.video;
      } else if (Array.isArray(data.result)) {
        // /x/web-interface/search/all/v2 — result[] (array of mixed types)
        videos = data.result.filter((item: any) => item.bvid);
      } else if (data.videos) {
        videos = data.videos;
      }

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
      bvid: d.bvid,
      title: d.title,
      author: d.owner?.name || '',
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
