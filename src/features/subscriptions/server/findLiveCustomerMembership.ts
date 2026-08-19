/**
 * Block a second live membership for the same person at one business.
 * Match on normalized email or phone.
 */

import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customerMembershipsOf } from './membershipTablesQuery';

/** Still billed / has access — not fully canceled. Includes cancel-at-period-end. */
export const LIVE_CUSTOMER_MEMBERSHIP_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
] as const;

export const ALREADY_SUBSCRIBED_ERROR =
  'You already have a subscription. Manage your plan if you need to make changes.';

export type LiveCustomerMembershipMatch = {
  id: string;
};

/** Phone keys stored on memberships may be 10 national digits or `1` + 10. */
export function membershipLookupPhoneVariants(
  phone: string | null | undefined
): string[] {
  const variants = new Set<string>();
  const raw = normalizePhoneForLookup(phone);
  if (raw) variants.add(raw);
  const ten = normalizeUsPhoneDigits(phone ?? '');
  if (ten.length === 10) {
    variants.add(ten);
    variants.add(`1${ten}`);
  }
  return [...variants];
}

export async function findLiveCustomerMembership(args: {
  supabase: SupabaseClient<Database>;
  businessId: string;
  email?: string | null;
  phone?: string | null;
}): Promise<LiveCustomerMembershipMatch | null> {
  const businessId = args.businessId.trim();
  if (!businessId) return null;

  const email = args.email?.trim() ? normalizeEmailForLookup(args.email) : '';
  const phones = membershipLookupPhoneVariants(args.phone);
  if (!email && phones.length === 0) return null;

  const base = () =>
    customerMembershipsOf(args.supabase)
      .select('id')
      .eq('business_id', businessId)
      .in('status', [...LIVE_CUSTOMER_MEMBERSHIP_STATUSES])
      .limit(1);

  if (email) {
    const { data } = await base()
      .eq('customer_email_normalized', email)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return { id };
  }

  if (phones.length > 0) {
    const { data } = await base()
      .in('customer_phone_normalized', phones)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return { id };
  }

  return null;
}
