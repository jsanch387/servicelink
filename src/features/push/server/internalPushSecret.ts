import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyInternalPushSecret(
  request: NextRequest
): 'ok' | 'not_configured' | 'unauthorized' {
  const configuredSecret = process.env.INTERNAL_PUSH_API_SECRET?.trim();
  if (!configuredSecret) {
    return 'not_configured';
  }

  const provided = request.headers.get('x-internal-push-secret') ?? '';
  if (!constantTimeEqual(provided, configuredSecret)) {
    return 'unauthorized';
  }

  return 'ok';
}
