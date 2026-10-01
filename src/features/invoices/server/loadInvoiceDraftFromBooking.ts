import type { SupabaseClient } from '@supabase/supabase-js';

import {
  invoiceDraftFromBooking,
  type BookingInvoiceSource,
} from '../utils/invoiceDraftFromBooking';

import type { InvoiceDraft } from '../types';

const BOOKING_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InvoiceFromBooking =
  | { kind: 'existing'; invoiceId: string }
  | { kind: 'draft'; bookingId: string; draft: InvoiceDraft }
  | { kind: 'none' };

export function readInvoiceBookingId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return BOOKING_ID.test(id) ? id : null;
}

/**
 * Opens the invoice already tied to this appointment, or a prefilled draft.
 * A cancelled appointment does not prefill.
 */
export async function loadInvoiceDraftFromBooking(
  supabase: SupabaseClient,
  businessId: string,
  bookingId: string
): Promise<InvoiceFromBooking> {
  const id = readInvoiceBookingId(bookingId);
  if (!id) return { kind: 'none' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing, error: existingError } = await db
    .from('invoices')
    .select('id')
    .eq('business_id', businessId)
    .eq('booking_id', id)
    .neq('status', 'void')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error('invoice for booking:', existingError);
  } else if (existing?.id) {
    return { kind: 'existing', invoiceId: String(existing.id) };
  }

  const { data: booking, error } = await db
    .from('bookings')
    .select(
      'id, status, customer_name, customer_email, customer_phone, service_name, service_price_cents, addon_details, job_details, discount_cents, discount_label'
    )
    .eq('id', id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !booking) {
    if (error) console.error('booking for invoice:', error);
    return { kind: 'none' };
  }
  if (booking.status === 'cancelled') return { kind: 'none' };

  const source: BookingInvoiceSource = {
    customerName:
      typeof booking.customer_name === 'string' ? booking.customer_name : '',
    customerEmail:
      typeof booking.customer_email === 'string'
        ? booking.customer_email
        : null,
    customerPhone:
      typeof booking.customer_phone === 'string'
        ? booking.customer_phone
        : null,
    serviceName:
      typeof booking.service_name === 'string' ? booking.service_name : '',
    servicePriceCents:
      typeof booking.service_price_cents === 'number'
        ? booking.service_price_cents
        : null,
    addonDetails: booking.addon_details,
    jobDetails: booking.job_details,
    discountCents:
      typeof booking.discount_cents === 'number'
        ? booking.discount_cents
        : null,
    discountLabel:
      typeof booking.discount_label === 'string'
        ? booking.discount_label
        : null,
  };

  return {
    kind: 'draft',
    bookingId: id,
    draft: invoiceDraftFromBooking(source),
  };
}
