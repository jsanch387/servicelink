import type { SupabaseClient } from '@supabase/supabase-js';

import { notifyOwnerInvoicePaid } from './notifyOwnerInvoicePaid';

export type SharedInvoicePaymentMethod =
  | 'cash'
  | 'payment_app'
  | 'other'
  | 'card';

export type BookingPaymentCoverageInput = {
  paymentMethodSelected: string | null;
  paymentStatus: string | null;
  paidOnlineAmountCents: number | null;
  remainingAmountCents: number | null;
  sessionPaymentMethod: string | null;
  sessionPaymentAmountCents: number | null;
};

/**
 * The appointment balance is already collected, so a linked invoice should not ask again.
 * A pay-in-person balance still due is not settled.
 */
export function bookingBalanceIsSettled(
  input: BookingPaymentCoverageInput
): boolean {
  const selected = (input.paymentMethodSelected ?? '').trim().toLowerCase();
  if (selected === 'membership') return true;

  const remaining = input.remainingAmountCents;
  if (remaining == null || remaining > 0) return false;

  const paidOnline = input.paidOnlineAmountCents ?? 0;
  const sessionPaid = input.sessionPaymentAmountCents ?? 0;
  const status = (input.paymentStatus ?? '').trim().toLowerCase();
  return paidOnline > 0 || sessionPaid > 0 || status === 'paid_full';
}

export function invoiceMethodForSettledBooking(
  input: BookingPaymentCoverageInput
): SharedInvoicePaymentMethod {
  const session = (input.sessionPaymentMethod ?? '').trim().toLowerCase();
  if (session === 'cash' || session === 'payment_app' || session === 'other') {
    return session;
  }
  if (session === 'tap_to_pay') return 'card';
  if ((input.paidOnlineAmountCents ?? 0) > 0) return 'card';
  return 'other';
}

function coverageFromRow(row: Record<string, unknown> | null): {
  settled: boolean;
  method: SharedInvoicePaymentMethod;
} {
  if (!row) return { settled: false, method: 'other' };
  const input: BookingPaymentCoverageInput = {
    paymentMethodSelected:
      typeof row.payment_method_selected === 'string'
        ? row.payment_method_selected
        : null,
    paymentStatus:
      typeof row.payment_status === 'string' ? row.payment_status : null,
    paidOnlineAmountCents:
      typeof row.paid_online_amount_cents === 'number'
        ? row.paid_online_amount_cents
        : null,
    remainingAmountCents:
      typeof row.remaining_amount_cents === 'number'
        ? row.remaining_amount_cents
        : null,
    sessionPaymentMethod:
      typeof row.session_payment_method === 'string'
        ? row.session_payment_method
        : null,
    sessionPaymentAmountCents:
      typeof row.session_payment_amount_cents === 'number'
        ? row.session_payment_amount_cents
        : null,
  };
  return {
    settled: bookingBalanceIsSettled(input),
    method: invoiceMethodForSettledBooking(input),
  };
}

export async function loadBookingPaymentCoverage(
  admin: SupabaseClient,
  bookingId: string
): Promise<{ settled: boolean; method: SharedInvoicePaymentMethod }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('booking_payments')
    .select(
      'payment_method_selected, payment_status, paid_online_amount_cents, remaining_amount_cents, session_payment_method, session_payment_amount_cents'
    )
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('booking payment coverage:', error);
    return { settled: false, method: 'other' };
  }
  return coverageFromRow(data);
}

export async function customerInvoiceCoversBooking(
  admin: SupabaseClient,
  businessId: string,
  bookingId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('invoices')
    .select('id')
    .eq('business_id', businessId)
    .eq('booking_id', bookingId)
    .eq('status', 'paid')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('paid invoice for booking:', error);
    return false;
  }
  return Boolean(data?.id);
}

export async function listBookingIdsWithPaidCustomerInvoice(
  admin: SupabaseClient,
  businessId: string,
  bookingIds: string[]
): Promise<Set<string>> {
  const ids = [...new Set(bookingIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('invoices')
    .select('booking_id')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .in('booking_id', ids);

  if (error || !Array.isArray(data)) {
    if (error) console.error('paid invoices for bookings:', error);
    return new Set();
  }

  return new Set(
    data
      .map(row => (typeof row.booking_id === 'string' ? row.booking_id : ''))
      .filter(Boolean)
  );
}

/** A sent bill for this appointment becomes Paid. Drafts stay drafts until they are sent. */
export async function markSentInvoicePaidForBooking(
  admin: SupabaseClient,
  businessId: string,
  bookingId: string,
  method: SharedInvoicePaymentMethod
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: method,
    })
    .eq('business_id', businessId)
    .eq('booking_id', bookingId)
    .eq('status', 'sent')
    .select('id');

  if (error) {
    console.error('mark sent invoice paid from booking:', error);
    return;
  }

  const paidIds = Array.isArray(data)
    ? data
        .map(row => (typeof row?.id === 'string' ? row.id : ''))
        .filter(Boolean)
    : [];
  await Promise.all(
    paidIds.map(invoiceId =>
      notifyOwnerInvoicePaid(admin, { businessId, invoiceId })
    )
  );
}
