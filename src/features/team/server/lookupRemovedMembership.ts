import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { REMOVED_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import { adminDb } from './adminDb';

export type RemovedMembership = {
  businessId: string;
  businessName: string;
};

/** Most recent shop that removed this user, if any. */
export async function lookupRemovedMembership(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<RemovedMembership | null> {
  const db = adminDb(supabase);
  const { data, error } = await db
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .eq('status', REMOVED_TEAM_MEMBER_STATUS)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const businessId =
    typeof data?.business_id === 'string' ? data.business_id.trim() : '';
  if (error || !businessId) {
    return null;
  }

  const { data: shop } = await db
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  const businessName =
    typeof shop?.business_name === 'string' ? shop.business_name.trim() : '';

  return {
    businessId,
    businessName: businessName || 'this shop',
  };
}
