/**
 * tRPC API 路由处理 (Next.js App Router)
 * 这是 tRPC 的 HTTP 入口点
 */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { appRouter } from '@/server/trpc';
import { createContext } from '@/server/trpc/context';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
