import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { getClientIp } from '@/server/rateLimit/getClientIp';

/**
 * Stable anonymous visitor id (hashed IP + User-Agent) for short dedup lookups.
 * Computed server-side only — never accept visitor_key from the client.
 */
export function deriveVisitorKey(request: NextRequest): string {
  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent')?.trim() ?? '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex');
}
