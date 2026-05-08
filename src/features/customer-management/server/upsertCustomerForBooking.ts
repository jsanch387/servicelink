/**
 * Ensures a `customers` row exists for this business + contact (dedupe by phone, then email).
 * Used when a V2 availability booking is created (public profile or owner booking on behalf).
 *
 * Do not import from client components — server / API only.
 *
 * Note: Uses a narrow cast for `.from('customers')` because the hand-maintained `Database`
 * type in this repo does not yet satisfy newer `@supabase/supabase-js` table generics.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from './normalizeCustomerContact';

export interface UpsertCustomerForBookingInput {
  fullName: string;
  email: string;
  phone?: string | null;
}

type CustomerIdRow = { id: string };

/**
 * Find existing customer for `business_id` or insert a new row.
 * Match order: `phone_normalized` (if present), then `email_normalized`.
 */
export async function upsertCustomerForBooking(
  supabase: SupabaseClient<Database>,
  businessId: string,
  input: UpsertCustomerForBookingInput
): Promise<{ id: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const full_name = input.fullName.trim();
  const rawEmail = (input.email ?? '').trim();
  const email_normalized = rawEmail ? normalizeEmailForLookup(rawEmail) : null;
  const phone_normalized = normalizePhoneForLookup(input.phone ?? null);
  /** Store digits-only in `phone` when present (canonical display + dedupe). */
  const phone = phone_normalized;
  /** Canonical email in DB when provided; otherwise null (owner booking without email). */
  const email = email_normalized;

  if (phone_normalized) {
    const { data: byPhone } = await db
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone_normalized', phone_normalized)
      .maybeSingle();

    const row = byPhone as CustomerIdRow | null;
    if (row?.id) {
      return { id: row.id };
    }
  }

  if (email_normalized) {
    const { data: byEmail } = await db
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('email_normalized', email_normalized)
      .maybeSingle();

    const emailRow = byEmail as CustomerIdRow | null;
    if (emailRow?.id) {
      return { id: emailRow.id };
    }
  }

  const { data: inserted, error } = await db
    .from('customers')
    .insert({
      business_id: businessId,
      full_name,
      phone,
      email,
      phone_normalized,
      email_normalized,
      notes: null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      if (phone_normalized) {
        const { data: againPhone } = await db
          .from('customers')
          .select('id')
          .eq('business_id', businessId)
          .eq('phone_normalized', phone_normalized)
          .maybeSingle();
        const r = againPhone as CustomerIdRow | null;
        if (r?.id) {
          return { id: r.id };
        }
      }
      if (email_normalized) {
        const { data: againEmail } = await db
          .from('customers')
          .select('id')
          .eq('business_id', businessId)
          .eq('email_normalized', email_normalized)
          .maybeSingle();
        const r2 = againEmail as CustomerIdRow | null;
        if (r2?.id) {
          return { id: r2.id };
        }
      }
    }
    throw error;
  }

  const ins = inserted as CustomerIdRow | null;
  if (!ins?.id) {
    throw new Error('Customer insert did not return id');
  }

  return { id: ins.id };
}
