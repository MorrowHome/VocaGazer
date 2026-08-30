/**
 * 手动触发采集 + 排行榜生成
 * 必须带 CRON_SECRET（x-cron-secret / Authorization Bearer）或管理员 JWT
 *
 * GET/POST /api/crawl/trigger?type=crawl|ranking|both
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  const headerSecret =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';

  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    return true;
  }

  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(auth.slice(7));
      if (payload.role === 'admin') return true;
    } catch {
      // ignore invalid jwt
    }
  }

  if (process.env.NODE_ENV !== 'production' && !cronSecret) {
    return true;
  }

  return false;
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: '未授权' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') || 'both';
  const results: Record<string, unknown> = {};

  if (type === 'crawl' || type === 'both') {
    try {
      const { runCrawl } = await import('@/server/services/bilibili/crawler');
      const result = await runCrawl({
        withinHours: 72,
        requestDelay: 600,
        verbose: false,
      });
      results.crawl = {
        success: true,
        totalVideos: result.totalVideos,
        originalCount: result.originalCount,
        savedCount: result.savedCount,
        errors: result.errors.slice(0, 5),
        skipped: result.skipped,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.crawl = { success: false, error: message };
    }
  }

  if (type === 'ranking' || type === 'both') {
    try {
      const { generateAllRankings } = await import('@/server/services/ranking/generator');
      const result = await generateAllRankings();
      results.ranking = { success: true, result };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.ranking = { success: false, error: message };
    }
  }

  return NextResponse.json({ ok: true, type, results, timestamp: new Date().toISOString() });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
