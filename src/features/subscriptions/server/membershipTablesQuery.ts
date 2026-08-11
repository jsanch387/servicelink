import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * PostgREST typing for hand-maintained `Database` tables can resolve to `never`.
 * Runtime queries are fine; this helper keeps call sites typed enough to compile.
 */
export function membershipPlansOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from('membership_plans');
}

export function membershipPlanPricesOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from(
    'membership_plan_prices'
  );
}

export function customerMembershipsOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from(
    'customer_memberships'
  );
}

export function membershipEventsOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from('membership_events');
}

export function membershipInvoicesOf(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see module docstring
  return (supabase as unknown as SupabaseClient<any>).from(
    'membership_invoices'
  );
}
