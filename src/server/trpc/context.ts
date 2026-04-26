/**
 * tRPC 上下文
 * 每个请求都会创建此上下文，可用于认证、数据库访问等
 */
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { prisma } from '@/lib/prisma';

// 上下文中的用户类型
export interface ContextUser {
  id: string;
  role: string;
}

/**
 * 创建上下文
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // TODO: 后续实现真正的会话认证
  const authHeader = req.headers.authorization;
  let user: ContextUser | null = null;

  if (authHeader) {
    // 简化处理：后续接入完整认证系统
    // const token = authHeader.replace('Bearer ', '');
    // TODO: 验证 token 并获取用户
  }

  return {
    prisma,
    user,
    req,
    res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
