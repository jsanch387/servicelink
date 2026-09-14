import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import { adminDb } from './adminDb';

export type ActiveMembership = {
  businessId: string;
  role: string;
};

/** Active teammate row for this user, if any. */
export async function lookupActiveMembership(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ActiveMembership | null> {
  const { data, error } = await adminDb(supabase)
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', userId)
    .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.business_id) {
    return null;
  }

  return {
    businessId: data.business_id,
    role: typeof data.role === 'string' ? data.role : 'member',
  };
}
