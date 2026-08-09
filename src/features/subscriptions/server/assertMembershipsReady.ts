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
