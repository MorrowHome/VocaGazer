/**
 * tRPC 服务端初始化
 */
import { initTRPC, inferAsyncReturnType } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { createContext, ContextUser } from './context';

type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * 检查用户是否已认证的中间件
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  const user = (ctx as any).user as ContextUser | null;
  if (!user) {
    throw new Error('未登录');
  }
  return next({
    ctx: {
      user,
    },
  });
});

/**
 * 检查用户是否为管理员的中间件
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  const user = (ctx as any).user as ContextUser | null;
  if (!user || user.role !== 'admin') {
    throw new Error('需要管理员权限');
  }
  return next({
    ctx: {
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
