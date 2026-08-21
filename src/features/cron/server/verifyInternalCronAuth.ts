import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function providedSecrets(request: NextRequest): string[] {
  const values: string[] = [];
  const header = request.headers.get('x-internal-push-secret')?.trim();
  if (header) values.push(header);

  const auth = request.headers.get('authorization') ?? '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token) values.push(token);
  }
  return values;
}

function configuredSecrets(): string[] {
  return [process.env.CRON_SECRET, process.env.INTERNAL_PUSH_API_SECRET]
    .map(value => value?.trim() ?? '')
    .filter(Boolean);
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 * Manual QA can use `x-internal-push-secret` (same as other internal push routes).
 */
export function verifyInternalCronAuth(
  request: NextRequest
): 'ok' | 'not_configured' | 'unauthorized' {
  const configured = configuredSecrets();
  if (configured.length === 0) {
    return 'not_configured';
  }

  const provided = providedSecrets(request);
  if (provided.length === 0) {
    return 'unauthorized';
  }

  for (const candidate of provided) {
    for (const secret of configured) {
      if (constantTimeEqual(candidate, secret)) {
        return 'ok';
      }
    }
  }

  return 'unauthorized';
}
