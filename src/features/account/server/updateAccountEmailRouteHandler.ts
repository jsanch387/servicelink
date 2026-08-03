import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requestAccountEmailChange } from './requestAccountEmailChange';
import { resolveAccountEmailChangeRedirectTo } from './resolveAccountEmailChangeRedirectTo';
import { assertUpdateAccountEmailRateLimit } from './updateAccountEmailRateLimit';

function jsonError(
  status: number,
  code: string,
  error: string,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success: false, code, error },
    { status, headers }
  );
}

export async function handleUpdateAccountEmailRequest(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if ('error' in auth) {
    console.warn('[account-email-change] auth failed:', auth.code);
    return jsonError(auth.status, auth.code, auth.error);
  }

  const { user, supabase } = auth;

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_BODY', 'Request body must be valid JSON.');
  }

  const bodyObj =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const newEmailRaw =
    typeof bodyObj.newEmail === 'string' ? bodyObj.newEmail : '';
  const redirectOrigin =
    typeof bodyObj.redirectOrigin === 'string' ? bodyObj.redirectOrigin : null;

  if (!newEmailRaw.trim()) {
    return jsonError(400, 'INVALID_BODY', 'newEmail is required.');
  }

  const rateLimit = await assertUpdateAccountEmailRateLimit(request, user.id);
  if (!rateLimit.ok) {
    console.warn(
      `[account-email-change] rate limited (retry in ${rateLimit.retryAfterSec}s)`
    );
    return jsonError(
      429,
      'RATE_LIMITED',
      'Please wait a moment before trying again.',
      {
        'Retry-After': String(rateLimit.retryAfterSec),
        'Cache-Control': 'no-store',
      }
    );
  }

  const emailRedirectTo = resolveAccountEmailChangeRedirectTo(
    request,
    redirectOrigin
  );

  console.info('[account-email-change] start', { emailRedirectTo });

  try {
    const result = await requestAccountEmailChange({
      supabase,
      currentEmail: user.email,
      newEmail: newEmailRaw,
      emailRedirectTo,
    });

    if (!result.ok) {
      console.warn('[account-email-change] aborted:', result.code);
      return jsonError(400, result.code, result.error);
    }

    return NextResponse.json(
      {
        success: true,
        pendingEmail: result.pendingEmail,
        message:
          'Check your inbox for a confirmation link to finish updating your email.',
        // Helps confirm local vs prod redirect when testing.
        ...(process.env.NODE_ENV === 'development' ? { emailRedirectTo } : {}),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(
      '[account-email-change] unhandled error:',
      err instanceof Error ? err.message : err
    );
    return jsonError(500, 'INTERNAL_ERROR', 'Something went wrong.');
  }
}
