import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Active customer memberships on a plan.
 * Returns 0 until `customer_memberships` (or equivalent) exists.
 */
export async function countActivePlanSubscribers(
  _supabase: SupabaseClient<Database>,
  _businessId: string,
  _planId: string
): Promise<number> {
  return 0;
}
