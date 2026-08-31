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
import { commentsRouter } from './routers/comments';
import { favoritesRouter } from './routers/favorites';
import { picksRouter } from './routers/picks';

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
  comments: commentsRouter,
  favorites: favoritesRouter,
  picks: picksRouter,
});

export type AppRouter = typeof appRouter;
