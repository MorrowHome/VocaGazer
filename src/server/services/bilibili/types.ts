/** Bilibili API 搜索返回的视频条目 */
export interface BiliSearchVideo {
  bvid: string;
  title: string;
  author: string;
  pubdate: number;
  description: string;
  tag?: string;
}

/** Bilibili 评论 */
export interface BiliComment {
  mid: number;
  uname: string;
  content: string;
  likes: number;
  rpid: number;
  avatar: string;
  /** 格式化时间 */
  ctime: string;
}

/** 热评结果 */
export interface HotCommentsResult {
  comments: BiliComment[];
  total: number;
}

/** Bilibili API 视频详情 */
export interface BiliVideoDetail {
  aid: number;
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
