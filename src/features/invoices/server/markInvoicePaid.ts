import type { SupabaseClient } from '@supabase/supabase-js';

import type { ManualInvoicePaymentMethod } from '../manualPaymentMethod';
import { notifyOwnerInvoicePaid } from './notifyOwnerInvoicePaid';

export type MarkInvoicePaidResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Marks a sent invoice paid after cash, a payment app, or another off-app payment.
 * Card checkout uses the same status and does not call this.
 * A void or draft invoice is left unchanged.
 */
export async function markInvoicePaid(
  admin: SupabaseClient,
  input: {
    businessId: string;
    invoiceId: string;
    method: ManualInvoicePaymentMethod;
  }
): Promise<MarkInvoicePaidResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: row, error } = await db
    .from('invoices')
    .select('id, status')
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .maybeSingle();

  if (error) {
    console.error('mark invoice paid:', error);
    return { ok: false, error: 'Could not update this invoice.', status: 500 };
  }
  if (!row) {
    return { ok: false, error: 'Invoice not found.', status: 404 };
  }
  if (row.status === 'paid') return { ok: true };
  if (row.status !== 'sent') {
    return {
      ok: false,
      error: 'Only a sent invoice can be marked paid.',
      status: 409,
    };
  }

  const { error: updateError } = await db
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: input.method,
    })
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .eq('status', 'sent');

  if (updateError) {
    console.error('mark invoice paid update:', updateError);
    return { ok: false, error: 'Could not update this invoice.', status: 500 };
  }

  await notifyOwnerInvoicePaid(admin, {
    businessId: input.businessId,
    invoiceId: input.invoiceId,
  });

  return { ok: true };
}
