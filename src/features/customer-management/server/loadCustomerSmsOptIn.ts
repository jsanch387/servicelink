/**
 * Load `customers.sms_opt_in` for outbound SMS gates.
 * Missing customer → treat as opted in (safe default for legacy paths).
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customerSmsOptedIn } from '../utils/customerSmsOptIn';

export async function loadCustomerSmsOptIn(
  supabase: SupabaseClient<Database>,
  customerId: string | null | undefined
): Promise<boolean> {
  const id = customerId?.trim();
  if (!id) return true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('customers')
    .select('sms_opt_in')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return true;
  return customerSmsOptedIn((data as { sms_opt_in?: unknown }).sms_opt_in);
}
