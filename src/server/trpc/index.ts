/**
 * tRPC 路由根组合
 */
import { router } from './trpc';
import { songsRouter } from './routers/songs';
import { rankingsRouter } from './routers/rankings';
import { postsRouter } from './routers/posts';
import { usersRouter } from './routers/users';
import { analyticsRouter } from './routers/analytics';
import { crawlRouter } from './routers/crawl';

export const appRouter = router({
  songs: songsRouter,
  rankings: rankingsRouter,
  posts: postsRouter,
  users: usersRouter,
  analytics: analyticsRouter,
  crawl: crawlRouter,
});

export type AppRouter = typeof appRouter;
