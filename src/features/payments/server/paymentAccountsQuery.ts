import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * PostgREST 12+ expects each `Tables[…]` entry to match `GenericTable` (incl.
 * `Relationships`). Our hand-maintained `Database` type is incomplete for most
 * tables, so `supabase.from('payment_accounts')` incorrectly infers `never`.
 * This helper keeps runtime correct while we gradually align generated types.
 */
export function paymentAccountsOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from('payment_accounts');
}
