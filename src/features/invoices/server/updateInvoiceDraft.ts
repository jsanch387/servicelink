import type { SupabaseClient } from '@supabase/supabase-js';

import type { ParsedInvoiceDraft } from '../utils/parseSaveInvoiceDraft';

const POSITION_OFFSET = 1000;

type UpdateInvoiceDraftResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Replaces a draft's details and lines. Sent, paid, and void invoices stay as they are.
 * Existing lines move out of the way first so positions can be rewritten without colliding.
 */
export async function updateInvoiceDraft(
  admin: SupabaseClient,
  input: {
    businessId: string;
    invoiceId: string;
    draft: ParsedInvoiceDraft;
  }
): Promise<UpdateInvoiceDraftResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { draft } = input;

  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('id, status')
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .maybeSingle();

  if (invoiceError) {
    console.error('update invoice draft lookup:', invoiceError);
    return { ok: false, error: 'Could not save this draft.', status: 500 };
  }
  if (!invoice) {
    return { ok: false, error: 'Invoice not found.', status: 404 };
  }
  if (invoice.status !== 'draft') {
    return { ok: false, error: 'Only drafts can be edited.', status: 409 };
  }

  const { data: existingLines, error: existingError } = await db
    .from('invoice_line_items')
    .select('id, position')
    .eq('invoice_id', input.invoiceId);

  if (existingError || !Array.isArray(existingLines)) {
    console.error('update invoice draft lines:', existingError);
    return { ok: false, error: 'Could not save this draft.', status: 500 };
  }

  const parked = [...existingLines].sort(
    (a, b) => Number(b.position) - Number(a.position)
  );
  for (const line of parked) {
    const { error } = await db
      .from('invoice_line_items')
      .update({ position: Number(line.position) + POSITION_OFFSET })
      .eq('id', line.id)
      .eq('invoice_id', input.invoiceId);
    if (error) {
      console.error('park invoice line:', error);
      return { ok: false, error: 'Could not save this draft.', status: 500 };
    }
  }

  const existingIds = new Set(existingLines.map(line => String(line.id)));

  for (const line of draft.lines) {
    const payload = {
      position: line.position,
      description: line.description,
      quantity: line.quantity,
      unit_amount_cents: line.unitAmountCents,
      amount_cents: line.amountCents,
    };

    if (line.id && existingIds.has(line.id)) {
      const { error } = await db
        .from('invoice_line_items')
        .update(payload)
        .eq('id', line.id)
        .eq('invoice_id', input.invoiceId);
      if (error) {
        console.error('update invoice line:', error);
        return { ok: false, error: 'Could not save this draft.', status: 500 };
      }
      continue;
    }

    const { error } = await db.from('invoice_line_items').insert({
      invoice_id: input.invoiceId,
      ...payload,
    });
    if (error) {
      console.error('insert invoice line:', error);
      return { ok: false, error: 'Could not save this draft.', status: 500 };
    }
  }

  const { error: deleteError } = await db
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', input.invoiceId)
    .gte('position', POSITION_OFFSET);

  if (deleteError) {
    console.error('delete replaced invoice lines:', deleteError);
    return { ok: false, error: 'Could not save this draft.', status: 500 };
  }

  const { error: headerError } = await db
    .from('invoices')
    .update({
      customer_name: draft.customerName,
      customer_email: draft.customerEmail,
      customer_phone: draft.customerPhone,
      note: draft.note,
      due_on: draft.dueOn,
      subtotal_cents: draft.subtotalCents,
      total_cents: draft.totalCents,
    })
    .eq('id', input.invoiceId)
    .eq('business_id', input.businessId)
    .eq('status', 'draft');

  if (headerError) {
    console.error('update invoice draft:', headerError);
    return { ok: false, error: 'Could not save this draft.', status: 500 };
  }

  return { ok: true };
}
