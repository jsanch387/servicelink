import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MembershipsAccessGate } from '../types/membershipsAccess';
import { loadMembershipsAccess } from './loadMembershipsAccess';

export const MEMBERSHIPS_GATE_ERRORS: Record<
  Exclude<MembershipsAccessGate, 'ready'>,
  string
> = {
  not_in_rollout: 'Subscriptions are not available for this account yet.',
  not_pro: 'Upgrade to Pro to offer subscriptions.',
  needs_connect: 'Finish Stripe setup before offering subscriptions.',
  needs_payments: 'Turn on ServiceLink payments before offering subscriptions.',
};

export type AssertMembershipsReadyResult =
  | { ok: true }
  | {
      ok: false;
      status: 403;
      error: string;
      gate: Exclude<MembershipsAccessGate, 'ready'>;
    };

/** Full access — create / edit / delete plans (requires Pro + Connect + payments). */
export async function assertMembershipsReady(
  supabase: SupabaseClient<Database>,
  userId: string,
  businessId: string,
  ownerEmail?: string | null
): Promise<AssertMembershipsReadyResult> {
  const access = await loadMembershipsAccess(
    supabase,
    userId,
    businessId,
    ownerEmail
  );
  if (access.gate === 'ready') {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: MEMBERSHIPS_GATE_ERRORS[access.gate],
    gate: access.gate,
  };
}

/**
 * Owner can still list/manage existing members when Pro lapses.
 * Plan catalog writes stay behind {@link assertMembershipsReady}.
 */
export async function assertMembershipsSubscriberAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  businessId: string,
  ownerEmail?: string | null
): Promise<AssertMembershipsReadyResult> {
  const access = await loadMembershipsAccess(
    supabase,
    userId,
    businessId,
    ownerEmail
  );
  if (access.gate === 'ready' || access.gate === 'not_pro') {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: MEMBERSHIPS_GATE_ERRORS[access.gate],
    gate: access.gate,
  };
}
