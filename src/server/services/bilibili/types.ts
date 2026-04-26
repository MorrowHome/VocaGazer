/** Bilibili API 搜索返回的视频条目 */
export interface BiliSearchVideo {
  bvid: string;
  title: string;
  author: string;
  pubdate: number;
  description: string;
  tag?: string;
}

/** Bilibili API 视频详情 */
export interface BiliVideoDetail {
  bvid: string;
  title: string;
  author: string;
  pubdate: number;
  description: string;
  duration: number;
  pic: string;
  tags: string[];
  statistics: {
    view: number;
    like: number;
    coin: number;
    favorite: number;
    share: number;
    reply: number;
  };
}

/** 入库前的歌曲数据结构 */
export interface SongData {
  bvId: string;
  title: string;
  author: string;
  publishTime: Date;
  description: string;
  duration: number;
  picUrl: string;
  tags: string[];
  statistics: {
    playCount: number;
    likes: number;
    coins: number;
    favorites: number;
    shares: number;
    comments: number;
  };
}
