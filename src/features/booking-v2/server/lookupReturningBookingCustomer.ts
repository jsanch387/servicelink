import { normalizePhoneForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ReturningBookingCustomer = {
  fullName: string;
  email: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zip: string;
};

type AddressBits = Pick<
  ReturningBookingCustomer,
  'streetAddress' | 'unitApt' | 'city' | 'state' | 'zip'
>;

function cleanState(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);
}

function cleanZip(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5);
}

function addressFrom(row: {
  street?: string | null;
  unit?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): AddressBits {
  return {
    streetAddress: String(row.street ?? '').trim(),
    unitApt: String(row.unit ?? '').trim(),
    city: String(row.city ?? '').trim(),
    state: cleanState(String(row.state ?? '')),
    zip: cleanZip(String(row.zip ?? '')),
  };
}

function addressIsUsable(address: AddressBits): boolean {
  return Boolean(
    address.streetAddress &&
      address.city &&
      address.state.length === 2 &&
      address.zip.length === 5
  );
}

/**
 * Contact and service address for someone who already booked with this business.
 * Matched by phone only. Returns null when nobody matches.
 */
export async function lookupReturningBookingCustomer(
  supabase: SupabaseClient<Database>,
  args: { businessId: string; phone: string }
): Promise<ReturningBookingCustomer | null> {
  const digits = normalizeUsPhoneDigits(args.phone);
  const businessId = args.businessId.trim();
  if (!businessId || digits.length !== 10) return null;

  const phones = [digits, `1${digits}`].flatMap(phone => {
    const normalized = normalizePhoneForLookup(phone);
    return normalized ? [normalized] : [];
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data } = await db
    .from('customers')
    .select(
      'id, full_name, email, email_normalized, street_address, unit, city, state, zip'
    )
    .eq('business_id', businessId)
    .in('phone_normalized', phones)
    .limit(1);

  const row = (
    data as Array<{
      id?: string;
      full_name?: string | null;
      email?: string | null;
      email_normalized?: string | null;
      street_address?: string | null;
      unit?: string | null;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
    }> | null
  )?.[0];
  const customerId = row?.id?.trim();
  if (!row || !customerId) return null;

  let address = addressFrom({
    street: row.street_address,
    unit: row.unit,
    city: row.city,
    state: row.state,
    zip: row.zip,
  });

  if (!addressIsUsable(address)) {
    const { data: bookings } = await db
      .from('bookings')
      .select(
        'customer_street_address, customer_unit_apt, customer_city, customer_state, customer_zip'
      )
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5);
    for (const booking of (bookings ?? []) as Array<{
      customer_street_address?: string | null;
      customer_unit_apt?: string | null;
      customer_city?: string | null;
      customer_state?: string | null;
      customer_zip?: string | null;
    }>) {
      const candidate = addressFrom({
        street: booking.customer_street_address,
        unit: booking.customer_unit_apt,
        city: booking.customer_city,
        state: booking.customer_state,
        zip: booking.customer_zip,
      });
      if (addressIsUsable(candidate)) {
        address = candidate;
        break;
      }
    }
  }

  return {
    fullName: String(row.full_name ?? '').trim(),
    email: String(row.email_normalized ?? row.email ?? '')
      .trim()
      .toLowerCase(),
    ...address,
  };
}
