/**
 * tRPC 上下文
 * 每个请求都会创建此上下文，用于认证、数据库访问等
 */
import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 上下文中的用户类型
export interface ContextUser {
  id: string;
  role: string;
}

/**
 * 从 Request Headers 中获取指定 header
 * 兼容 Headers 对象和普通对象
 */
function getHeader(req: Request, name: string): string | null {
  const h = req.headers as any;
  if (typeof h?.get === 'function') {
    return h.get(name);
  }
  return h?.[name] ?? null;
}

/**
 * 创建上下文
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
  const { req, resHeaders } = opts;

  // 尝试从 Authorization header 中获取 token
  const authHeader = getHeader(req, 'authorization');
  const token = authHeader?.replace('Bearer ', '') || null;

  let user: ContextUser | null = null;

  if (token) {
    try {
      const payload = verifyToken(token);
      user = { id: payload.userId, role: payload.role };
    } catch {
      // token 无效或过期，user 保持 null
    }
  }

  return {
    prisma,
    user,
    req,
    resHeaders,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
