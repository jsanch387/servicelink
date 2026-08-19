/**
 * Shared auth + gates for owner subscriber routes (list / detail / actions).
 * Accepts web cookies or mobile `Authorization: Bearer`.
 */

import type { AuthenticatedRequestUser } from '@/libs/api/getAuthenticatedUser';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { Database } from '@/libs/supabase/client';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertMembershipsSubscriberAccess } from './assertMembershipsReady';
import {
  getMembershipsRequestId,
  membershipsJsonResponse,
} from './membershipsTransactionLog';

export type MembershipsSubscriberAuth =
  | {
      ok: true;
      requestId: string;
      user: AuthenticatedRequestUser['user'];
      supabase: SupabaseClient<Database>;
      businessId: string;
      userId: string;
    }
  | {
      ok: false;
      requestId: string;
      response: Response;
    };

export async function requireOwnerMembershipsSubscriberAccess(
  req: Request
): Promise<MembershipsSubscriberAuth> {
  const requestId = getMembershipsRequestId(req);
  const auth = await getAuthenticatedUser(req);
  if ('error' in auth) {
    return {
      ok: false,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: auth.error },
        { status: auth.status }
      ),
    };
  }

  const { supabase, user } = auth;

  const resolved = await resolveCurrentBusinessId(supabase);
  if (!resolved.ok) {
    return {
      ok: false,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: resolved.error },
        { status: resolved.status }
      ),
    };
  }

  const ready = await assertMembershipsSubscriberAccess(
    supabase,
    user.id,
    resolved.businessId,
    user.email
  );
  if (!ready.ok) {
    return {
      ok: false,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: ready.error, gate: ready.gate },
        { status: ready.status }
      ),
    };
  }

  return {
    ok: true,
    requestId,
    user,
    supabase,
    businessId: resolved.businessId,
    userId: user.id,
  };
}
