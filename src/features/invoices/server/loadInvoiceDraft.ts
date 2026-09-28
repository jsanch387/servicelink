import type { SupabaseClient } from '@supabase/supabase-js';

import { invoiceDraftFromStored } from '../utils/invoiceDraft';
import type { InvoiceDraft } from '../types';

type LoadInvoiceDraftResult = { ok: true; draft: InvoiceDraft } | { ok: false };

/**
 * Loads a draft the signed-in shop can already select. Non-drafts stay closed.
 */
export async function loadInvoiceDraft(
  supabase: SupabaseClient,
  businessId: string,
  invoiceId: string
): Promise<LoadInvoiceDraftResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: invoice, error } = await db
    .from('invoices')
    .select(
      'id, status, customer_name, customer_email, customer_phone, note, due_on'
    )
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !invoice || invoice.status !== 'draft') {
    if (error) console.error('load invoice draft:', error);
    return { ok: false };
  }

  const { data: lineRows, error: lineError } = await db
    .from('invoice_line_items')
    .select('id, position, description, quantity, unit_amount_cents')
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true });

  if (lineError || !Array.isArray(lineRows)) {
    console.error('load invoice lines:', lineError);
    return { ok: false };
  }

  return {
    ok: true,
    draft: invoiceDraftFromStored({
      customerName:
        typeof invoice.customer_name === 'string' ? invoice.customer_name : '',
      customerEmail:
        typeof invoice.customer_email === 'string'
          ? invoice.customer_email
          : null,
      customerPhone:
        typeof invoice.customer_phone === 'string'
          ? invoice.customer_phone
          : null,
      note: typeof invoice.note === 'string' ? invoice.note : null,
      dueOn: typeof invoice.due_on === 'string' ? invoice.due_on : null,
      lines: lineRows.map(line => ({
        id: String(line.id),
        position: Number(line.position),
        description:
          typeof line.description === 'string' ? line.description : '',
        quantity: Number(line.quantity),
        unitAmountCents: Number(line.unit_amount_cents),
      })),
    }),
  };
}
