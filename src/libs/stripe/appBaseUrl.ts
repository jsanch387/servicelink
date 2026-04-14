import type { NextRequest } from 'next/server';

/**
 * Public origin for Stripe redirect URLs (Checkout success/cancel, Connect return/refresh).
 * Prefer forwarded headers when behind a proxy; fall back to env / localhost.
 */
export function getAppBaseUrl(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  if (host) {
    return `${proto}://${host}`;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof process.env.VERCEL_URL === 'string'
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  );
}
