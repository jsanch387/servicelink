/**
 * Shared auth + gates for membership plan write routes (create / update / delete).
 * Accepts web cookies or mobile `Authorization: Bearer`.
 */

import type { AuthenticatedRequestUser } from '@/libs/api/getAuthenticatedUser';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { Database } from '@/libs/supabase/client';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertMembershipsReady } from './assertMembershipsReady';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
  shortIdForLog,
} from './membershipsTransactionLog';

export type MembershipsPlanWriteAuth =
  | {
      ok: true;
      requestId: string;
      user: AuthenticatedRequestUser['user'];
      supabase: SupabaseClient<Database>;
      businessId: string;
      authMethod: AuthenticatedRequestUser['authMethod'];
    }
  | {
      ok: false;
      requestId: string;
      response: Response;
    };

/**
 * Optional body/query `businessId` must match the owner’s business when present
 * (mobile defense-in-depth, same idea as other Bearer contracts).
 */
function optionalBusinessIdMismatch(
  raw: unknown,
  resolvedBusinessId: string
): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const bid = (raw as { businessId?: unknown }).businessId;
  if (typeof bid !== 'string' || !bid.trim()) return null;
  if (bid.trim() !== resolvedBusinessId) {
    return 'businessId does not match the authenticated owner’s business.';
  }
  return null;
}

export async function requireMembershipsPlanWriteAccess(
  request: Request,
  options?: { bodyForBusinessCheck?: unknown }
): Promise<MembershipsPlanWriteAuth> {
  const requestId = getMembershipsRequestId(request);

  const auth = await getAuthenticatedUser(request);
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

  const resolved = await resolveCurrentBusinessId(auth.supabase);
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

  const mismatch = optionalBusinessIdMismatch(
    options?.bodyForBusinessCheck,
    resolved.businessId
  );
  if (mismatch) {
    logMemberships(requestId, 'warn', 'write.business_mismatch', {
      businessId: shortIdForLog(resolved.businessId),
      authMethod: auth.authMethod,
    });
    return {
      ok: false,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: mismatch },
        { status: 403 }
      ),
    };
  }

  const ready = await assertMembershipsReady(
    auth.supabase,
    auth.user.id,
    resolved.businessId,
    auth.user.email
  );
  if (!ready.ok) {
    logMemberships(requestId, 'warn', 'write.gate_blocked', {
      businessId: shortIdForLog(resolved.businessId),
      gate: ready.gate,
      authMethod: auth.authMethod,
    });
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
    user: auth.user,
    supabase: auth.supabase,
    businessId: resolved.businessId,
    authMethod: auth.authMethod,
  };
}
