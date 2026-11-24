import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import type { Database } from '@/libs/supabase/client';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { TeamPermission } from '../constants/teamPermissions';
import { requireBusinessPermission } from './requireBusinessPermission';

export type ShopPermissionResult =
  | {
      ok: true;
      supabase: SupabaseClient<Database>;
      businessId: string;
      userId: string;
    }
  | { ok: false; error: string };

/**
 * Signed-in shop access for a server action. Owners still need a finished
 * shop. The returned client is the signed-in user; writes stay on that shop.
 */
export async function requireShopPermission(
  permission: TeamPermission
): Promise<ShopPermissionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const resolved = await requireBusinessPermission(supabase, permission);
  if (!resolved.ok) {
    return {
      ok: false,
      error:
        resolved.status === 403
          ? 'You do not have access to this shop.'
          : resolved.error,
    };
  }

  if (resolved.context.isOwner) {
    const state = await getOnboardingState(user.id, supabase);
    if (!state.success || state.data?.status !== 'completed') {
      return { ok: false, error: 'Business profile is not set up.' };
    }
  }

  return {
    ok: true,
    supabase,
    businessId: resolved.businessId,
    userId: user.id,
  };
}
