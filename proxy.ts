import { NextResponse, type NextRequest } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MULTIMODAL_BODY_BYTES = 768 * 1024;

type RequestWindow = { startedAt: number; count: number };

// Prototype guard only. Instances do not share memory, so production deployments
// must also enforce quotas at the platform/API layer.
const requestWindows = new Map<string, RequestWindow>();

function jsonError(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ success: false, error }, { status, headers });
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown-client';
}

export function proxy(request: NextRequest) {
  if (request.method !== 'POST') {
    return jsonError(405, 'Method not allowed.', { Allow: 'POST' });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return jsonError(400, 'Invalid Content-Length header.');
  }
  const bodyLimit = request.nextUrl.pathname === '/api/agents/retail-copilot'
    ? MAX_MULTIMODAL_BODY_BYTES
    : MAX_BODY_BYTES;
  if (contentLength > bodyLimit) {
    return jsonError(413, 'Request body is too large.');
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    return jsonError(403, 'Cross-site agent requests are not allowed.');
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return jsonError(403, 'Origin is not allowed.');
      }
    } catch {
      return jsonError(400, 'Invalid Origin header.');
    }
  }

  const now = Date.now();
  const key = clientKey(request);
  const current = requestWindows.get(key);
  const window = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;
  window.count += 1;
  requestWindows.set(key, window);

  if (window.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - window.startedAt)) / 1000));
    return jsonError(429, 'Too many AI requests. Try again shortly.', {
      'Retry-After': String(retryAfter),
    });
  }

  if (requestWindows.size > 2_000) {
    for (const [storedKey, storedWindow] of requestWindows) {
      if (now - storedWindow.startedAt >= WINDOW_MS) requestWindows.delete(storedKey);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/agents/:path*',
};
