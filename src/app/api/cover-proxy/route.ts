import { NextRequest, NextResponse } from 'next/server';

const ALLOWED = /(^|\.)hdslb\.com$/i;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u');
  if (!raw) return new NextResponse('missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('bad url', { status: 400 });
  }

  if (target.protocol !== 'https:' || !ALLOWED.test(target.hostname)) {
    return new NextResponse('host not allowed', { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      Referer: 'https://www.bilibili.com/',
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse('upstream', { status: 502 });
  }

  const type = upstream.headers.get('content-type') || 'image/jpeg';
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
