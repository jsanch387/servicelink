import type { SupabaseClient } from '@supabase/supabase-js';

export type DeleteInvoiceResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Removes an invoice in any status. Line items cascade.
 * The invoice number is not reused. A card charge is not refunded.
 */
export async function deleteInvoice(
  admin: SupabaseClient,
  input: { businessId: string; invoiceId: string }
): Promise<DeleteInvoiceResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data, error } = await db
    .from('invoices')
    .delete()
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .select('id');

  if (error) {
    console.error('delete invoice:', error);
    return { ok: false, error: 'Could not delete this invoice.', status: 500 };
  }

  const removed = Array.isArray(data) ? data.length : 0;
  if (removed === 0) {
    return { ok: false, error: 'Invoice not found.', status: 404 };
  }

  const { error: notificationError } = await db
    .from('notifications')
    .delete()
    .eq('reference_type', 'invoice')
    .eq('reference_id', input.invoiceId);

  if (notificationError) {
    console.error('delete invoice notification:', notificationError);
  }

  return { ok: true };
}
