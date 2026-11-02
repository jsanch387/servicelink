import {
  lookupActiveMemberBusinessId,
  lookupOwnedBusinessId,
} from '@/features/team';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type ResolveBusinessIdResult =
  | { ok: true; businessId: string }
  | { ok: false; error: string; status: number };

/**
 * Business for the signed-in user: owned shop first, then an active
 * teammate row. Owners never need `business_members`.
 */
export async function resolveCurrentBusinessId(
  supabase: SupabaseClient<Database>
): Promise<ResolveBusinessIdResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Authentication required', status: 401 };
  }

  const ownedBusinessId = await lookupOwnedBusinessId(supabase, user.id);
  if (ownedBusinessId) {
    return { ok: true, businessId: ownedBusinessId };
  }

  const memberBusinessId = await lookupActiveMemberBusinessId(
    supabase,
    user.id
  );
  if (memberBusinessId) {
    return { ok: true, businessId: memberBusinessId };
  }

  return { ok: false, error: 'Business profile not found', status: 404 };
}
