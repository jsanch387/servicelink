import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ACTIVE_TEAM_MEMBER_STATUS } from '../constants/teamRoles';
import { adminDb } from './adminDb';

/**
 * Shop this user was added to as an active teammate.
 * Returns null if the table is missing or the user has no active row.
 */
export async function lookupActiveMemberBusinessId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await adminDb(supabase)
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .eq('status', ACTIVE_TEAM_MEMBER_STATUS)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.business_id) {
    return null;
  }

  return data.business_id;
}
