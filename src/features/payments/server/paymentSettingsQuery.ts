import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Same pattern as `paymentAccountsOf`: hand-maintained `Database` is not fully
 * PostgREST-generic, so direct `.from('payment_settings')` can infer `never`.
 */
export function paymentSettingsOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see `paymentAccountsOf`
  return (supabase as unknown as SupabaseClient<any>).from('payment_settings');
}
