import { createSupabaseClientFromBearer } from '@/libs/supabase/bearer';
import type { Database } from '@/libs/supabase/client';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AuthenticatedRequestUser = {
  user: User;
  supabase: SupabaseClient<Database>;
  /** "bearer" when authed via Authorization header (mobile), "cookie" for web. */
  authMethod: 'bearer' | 'cookie';
};

export type AuthenticatedRequestError = {
  error: string;
  status: 401;
  code: 'UNAUTHORIZED';
};

/**
 * Resolve the authenticated user from a Next.js Request, accepting either:
 *
 * - `Authorization: Bearer <supabase access token>` (mobile / SDK clients), or
 * - Supabase auth cookies set by the SSR client (web).
 *
 * Returns either an authenticated context (user + supabase client tied to that
 * session) or a structured 401 the caller can return directly.
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthenticatedRequestUser | AuthenticatedRequestError> {
  const authHeader =
    request.headers.get('authorization') ??
    request.headers.get('Authorization');

  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return {
        error: 'Missing bearer token',
        status: 401,
        code: 'UNAUTHORIZED',
      };
    }
    const supabase = createSupabaseClientFromBearer(token);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return {
        error: 'Invalid or expired session',
        status: 401,
        code: 'UNAUTHORIZED',
      };
    }
    return { user: data.user, supabase, authMethod: 'bearer' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      error: 'Authentication required',
      status: 401,
      code: 'UNAUTHORIZED',
    };
  }
  return { user: data.user, supabase, authMethod: 'cookie' };
}

/** True when the client sent `Authorization: Bearer …` (valid or not). */
export function requestHasBearerAuth(request: Request): boolean {
  const authHeader =
    request.headers.get('authorization') ??
    request.headers.get('Authorization');
  return !!(authHeader && /^Bearer\s+/i.test(authHeader));
}

/**
 * Returns the authenticated user when a valid session exists; otherwise `null`.
 * Unlike `getAuthenticatedUser`, missing or cookie-only sessions without a user
 * do not produce a 401 — callers use this for optional auth (e.g. contact form).
 */
export async function tryGetAuthenticatedUser(
  request: Request
): Promise<AuthenticatedRequestUser | null> {
  const result = await getAuthenticatedUser(request);
  if ('error' in result) return null;
  return result;
}
