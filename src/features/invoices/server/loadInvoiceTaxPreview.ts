import type { SupabaseClient } from '@supabase/supabase-js';

import {
  invoiceTaxPreview,
  type InvoiceBookingTax,
} from '../utils/invoiceSalesTax';

export type InvoiceTaxPreview = {
  salesTaxEnabled: boolean;
  salesTaxRateBps: number;
};

const NO_TAX: InvoiceTaxPreview = {
  salesTaxEnabled: false,
  salesTaxRateBps: 0,
};

async function shopTaxPreview(
  supabase: SupabaseClient,
  businessId: string
): Promise<InvoiceTaxPreview> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('payment_settings')
    .select('tax_enabled, tax_rate_bps')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('invoice sales tax settings:', error);
    return NO_TAX;
  }

  return invoiceTaxPreview({
    shopTaxEnabled: data?.tax_enabled === true,
    shopTaxRateBps:
      typeof data?.tax_rate_bps === 'number' ? data.tax_rate_bps : 0,
    bookingPayment: null,
  });
}

/**
 * Tax the draft should show. A linked appointment uses the tax already stored
 * on that job, so a later settings change does not tax it again.
 */
export async function loadInvoiceTaxPreview(
  supabase: SupabaseClient,
  businessId: string,
  bookingId: string | null
): Promise<InvoiceTaxPreview> {
  const id = bookingId?.trim() ?? '';
  if (!id) return shopTaxPreview(supabase, businessId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select('id')
    .eq('id', id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (bookingError) {
    console.error('invoice sales tax booking:', bookingError);
    return NO_TAX;
  }
  if (!booking?.id) return shopTaxPreview(supabase, businessId);

  const { data: payment, error: paymentError } = await db
    .from('booking_payments')
    .select('tax_cents, tax_rate_bps')
    .eq('booking_id', id)
    .maybeSingle();

  if (paymentError) {
    console.error('invoice sales tax booking payment:', paymentError);
    return NO_TAX;
  }

  const bookingPayment: InvoiceBookingTax = {
    taxCents: typeof payment?.tax_cents === 'number' ? payment.tax_cents : 0,
    taxRateBps:
      typeof payment?.tax_rate_bps === 'number' ? payment.tax_rate_bps : 0,
  };

  return invoiceTaxPreview({
    shopTaxEnabled: false,
    shopTaxRateBps: 0,
    bookingPayment,
  });
}
