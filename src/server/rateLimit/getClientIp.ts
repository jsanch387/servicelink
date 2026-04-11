import type { NextRequest } from 'next/server';

/**
 * Best-effort client IP for rate limiting (Vercel, Cloudflare, common proxies).
 * Never trust for auth — only for abuse throttling.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return sanitizeIpToken(first);
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return sanitizeIpToken(real);
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) return sanitizeIpToken(cf);
  return 'unknown';
}

function sanitizeIpToken(raw: string): string {
  const s = raw.replace(/[^\d.a-fA-F:]/g, '').slice(0, 64);
  return s.length > 0 ? s : 'unknown';
}
