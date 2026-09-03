import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Existing customer only — do not insert. Used so SMS can honor `sms_opt_in`.
 */
export async function findCustomerIdForQuoteContact(
  supabase: SupabaseClient,
  businessId: string,
  contact: { email?: string | null; phone?: string | null }
): Promise<string | null> {
  const biz = businessId.trim();
  if (!biz) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const phone = normalizePhoneForLookup(contact.phone ?? null);
  const email = contact.email?.trim()
    ? normalizeEmailForLookup(contact.email)
    : null;

  if (phone) {
    const { data } = await db
      .from('customers')
      .select('id')
      .eq('business_id', biz)
      .eq('phone_normalized', phone)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return id;
  }

  if (email) {
    const { data } = await db
      .from('customers')
      .select('id')
      .eq('business_id', biz)
      .eq('email_normalized', email)
      .maybeSingle();
    const id = (data as { id?: string } | null)?.id?.trim();
    if (id) return id;
  }

  return null;
}
