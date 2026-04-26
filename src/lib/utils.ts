/**
 * 工具函数
 */

/** 格式化数量 */
export function formatCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/** 解析统计 JSON 字符串 */
export function parseStats(s: string): Record<string, number> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/** 计算相对时间 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

/**
 * 标准化 B 站封面图 URL
 * B 站图片支持 HTTPS，但 API 返回的是 HTTP 地址
 */
export function normalizePicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // 将 B 站图片的 HTTP 转为 HTTPS
  return url.replace(/^http:\/\//, 'https://');
}

/** 通用封面图 img 标签属性 */
export function coverImgProps(url: string | null | undefined) {
  const src = normalizePicUrl(url);
  if (!src) return { src: '', referrerPolicy: 'no-referrer' as const };
  return { src, referrerPolicy: 'no-referrer' as const };
}
