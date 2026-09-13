import {
  getAuthenticatedUser,
  type AuthenticatedRequestUser,
} from '@/libs/api/getAuthenticatedUser';
import type { Database } from '@/libs/supabase/client';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';
import { voiceError } from './voiceJson';

export type VoiceOwnerContext =
  | {
      ok: true;
      user: AuthenticatedRequestUser['user'];
      supabase: SupabaseClient<Database>;
      authMethod: AuthenticatedRequestUser['authMethod'];
      businessId: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

/**
 * Same gate as owner-manual booking: signed-in user who owns a business.
 * 401 if no/invalid session. 403 if signed in but not an owner.
 */
export async function requireVoiceOwner(
  request: Request
): Promise<VoiceOwnerContext> {
  const auth = await getAuthenticatedUser(request);
  if ('error' in auth) {
    console.warn('[voice-turn] auth failed', {
      status: auth.status,
      error: auth.error,
    });
    return { ok: false, response: voiceError(auth.status, auth.error) };
  }

  const resolved = await resolveCurrentBusinessId(auth.supabase);
  if (!resolved.ok) {
    console.warn('[voice-turn] not an owner', {
      status: resolved.status,
      error: resolved.error,
    });
    if (resolved.status === 401) {
      return { ok: false, response: voiceError(401, resolved.error) };
    }
    return { ok: false, response: voiceError(403, 'Forbidden') };
  }

  return {
    ok: true,
    user: auth.user,
    supabase: auth.supabase,
    authMethod: auth.authMethod,
    businessId: resolved.businessId,
  };
}
