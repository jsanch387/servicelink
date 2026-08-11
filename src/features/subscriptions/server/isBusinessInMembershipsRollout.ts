import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isOwnerEmailAllowedForMembershipsRollout,
  MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL,
} from '../config/membershipsRolloutAllowlist';

/**
 * Whether this business's owner is in the memberships email rollout.
 * Uses admin client (auth.admin + business_profiles).
 */
export async function isBusinessInMembershipsRollout(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<boolean> {
  if (MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL) return true;

  const id = businessId?.trim();
  if (!id) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: biz, error: bizError } = await (admin as any)
      .from('business_profiles')
      .select('profile_id')
      .eq('id', id)
      .maybeSingle();

    if (bizError) return false;

    const profileId = String(
      (biz as { profile_id?: string | null } | null)?.profile_id ?? ''
    ).trim();
    if (!profileId) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authResult = await (admin as any).auth.admin.getUserById(profileId);
    const email =
      (authResult?.data?.user?.email as string | undefined) ??
      (authResult?.user?.email as string | undefined) ??
      null;

    return isOwnerEmailAllowedForMembershipsRollout(email);
  } catch {
    return false;
  }
}
