import type { SupabaseClient } from '@supabase/supabase-js';

export type VoidInvoiceResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Voids a sent invoice. The number and public link stay.
 * A paid invoice stays paid. A draft was never sent.
 */
export async function voidInvoice(
  admin: SupabaseClient,
  input: { businessId: string; invoiceId: string }
): Promise<VoidInvoiceResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: row, error } = await db
    .from('invoices')
    .select('id, status')
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .maybeSingle();

  if (error) {
    console.error('void invoice:', error);
    return { ok: false, error: 'Could not update this invoice.', status: 500 };
  }
  if (!row) {
    return { ok: false, error: 'Invoice not found.', status: 404 };
  }
  if (row.status === 'void') return { ok: true };
  if (row.status !== 'sent') {
    return {
      ok: false,
      error: 'Only a sent invoice can be voided.',
      status: 409,
    };
  }

  const { error: updateError } = await db
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .eq('status', 'sent');

  if (updateError) {
    console.error('void invoice update:', updateError);
    return { ok: false, error: 'Could not update this invoice.', status: 500 };
  }

  return { ok: true };
}
