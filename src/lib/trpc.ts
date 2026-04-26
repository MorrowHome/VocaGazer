/**
 * tRPC 客户端 (用于前端调用)
 */
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc';

export const trpc = createTRPCReact<AppRouter>();
