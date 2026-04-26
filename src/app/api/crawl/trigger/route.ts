/**
 * 手动触发采集 + 排行榜生成的 API 路由
 * POST /api/crawl/trigger
 * GET  /api/crawl/trigger?type=crawl  仅采集
 * GET  /api/crawl/trigger?type=ranking 仅排行
 * GET  /api/crawl/trigger?type=both   采集+排行（默认）
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'both';

  const results: Record<string, any> = {};

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
      };
    } catch (err: any) {
      results.crawl = { success: false, error: err.message };
    }
  }

  if (type === 'ranking' || type === 'both') {
    try {
      const { generateAllRankings } = await import('@/server/services/ranking/generator');
      const result = await generateAllRankings();
      results.ranking = { success: true, result };
    } catch (err: any) {
      results.ranking = { success: false, error: err.message };
    }
  }

  return NextResponse.json({ ok: true, type, results, timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
