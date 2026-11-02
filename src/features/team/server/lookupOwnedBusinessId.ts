import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from './adminDb';

/** Business this user created (`business_profiles.profile_id`). */
export async function lookupOwnedBusinessId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await adminDb(supabase)
    .from('business_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}
