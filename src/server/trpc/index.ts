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
import { recommendRouter } from './routers/recommend';
import { aiRouter } from './routers/ai';
import { milestonesRouter } from './routers/milestones';

export const appRouter = router({
  songs: songsRouter,
  rankings: rankingsRouter,
  posts: postsRouter,
  users: usersRouter,
  analytics: analyticsRouter,
  crawl: crawlRouter,
  recommend: recommendRouter,
  ai: aiRouter,
  milestones: milestonesRouter,
});

export type AppRouter = typeof appRouter;
