import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteAccountForUser } from './deleteAccountForUser';
import { assertDeleteAccountRateLimit } from './deleteAccountRateLimit';

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

export async function handleDeleteAccountRequest(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if ('error' in auth) {
    console.warn('[account-delete] auth failed', {
      code: auth.code,
    });
    return jsonError(auth.status, auth.code, auth.error);
  }

  const { user, authMethod } = auth;

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_BODY', 'Request body must be valid JSON.');
  }

  const confirmEmailRaw =
    body &&
    typeof (body as { confirmEmail?: unknown }).confirmEmail === 'string'
      ? ((body as { confirmEmail: string }).confirmEmail as string)
      : '';
  const confirmEmail = confirmEmailRaw.trim().toLowerCase();
  const accountEmail = (user.email ?? '').trim().toLowerCase();

  if (!confirmEmail) {
    return jsonError(
      400,
      'INVALID_BODY',
      'confirmEmail is required to delete your account.'
    );
  }

  if (!accountEmail) {
    console.warn('[account-delete] auth user has no email', {
      authMethod,
    });
    return jsonError(
      400,
      'CONFIRM_EMAIL_MISMATCH',
      'Account email is not available for confirmation.'
    );
  }

  if (confirmEmail !== accountEmail) {
    console.warn('[account-delete] confirm email mismatch', {
      authMethod,
    });
    return jsonError(
      400,
      'CONFIRM_EMAIL_MISMATCH',
      'The email you entered does not match your account.'
    );
  }

  const rateLimit = await assertDeleteAccountRateLimit(request, user.id);
  if (!rateLimit.ok) {
    console.warn('[account-delete] rate limited', {
      authMethod,
      reason: rateLimit.reason,
      retryAfterSec: rateLimit.retryAfterSec,
    });
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

  console.info('[account-delete] start', {
    authMethod,
  });

  try {
    const result = await deleteAccountForUser({
      userId: user.id,
      userEmail: user.email ?? null,
    });

    if (!result.ok) {
      const status =
        result.code === 'STRIPE_ERROR'
          ? 502
          : result.code === 'AUTH_DELETE_FAILED'
            ? 500
            : 500;
      console.warn('[account-delete] aborted', {
        authMethod,
        outcomeCode: result.code,
        httpStatus: status,
      });
      return jsonError(status, result.code, result.error);
    }

    console.info('[account-delete] success', {
      authMethod,
      warningCount: result.warnings.length,
    });

    return NextResponse.json(
      { success: true, warnings: result.warnings },
      { status: 200 }
    );
  } catch (err) {
    console.error('[account-delete] unhandled error', {
      authMethod,
      message: err instanceof Error ? err.message : 'unknown',
    });
    return jsonError(500, 'INTERNAL_ERROR', 'Something went wrong.');
  }
}
