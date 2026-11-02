import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { lookupOwnedBusinessId } from './lookupOwnedBusinessId';

export type RequireOwnedBusinessResult =
  | { ok: true; businessId: string; userId: string }
  | { ok: false; error: string; status: number };

export async function requireOwnedBusiness(
  supabase: SupabaseClient<Database>
): Promise<RequireOwnedBusinessResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: 'Authentication required', status: 401 };
  }

  const businessId = await lookupOwnedBusinessId(supabase, user.id);
  if (!businessId) {
    return {
      ok: false,
      error: 'Only the owner can manage the team',
      status: 403,
    };
  }

  return { ok: true, businessId, userId: user.id };
}
