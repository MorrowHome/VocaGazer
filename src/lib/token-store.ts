/**
 * 客户端 token 存储管理
 * 使用模块级变量 + localStorage 双重缓存
 */

const STORAGE_KEY = 'vg_token';

let cachedToken: string | null = null;

export function getToken(): string | null {
  if (cachedToken === null && typeof window !== 'undefined') {
    cachedToken = localStorage.getItem(STORAGE_KEY);
  }
  return cachedToken;
}

export function setToken(token: string | null) {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function clearToken() {
  setToken(null);
}
