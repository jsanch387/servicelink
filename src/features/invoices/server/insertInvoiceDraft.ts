import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import type { ParsedInvoiceDraft } from '../utils/parseSaveInvoiceDraft';

type InsertInvoiceDraftResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string };

function createPublicToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Inserts a draft with the service role. Authenticated clients can only select.
 */
export async function insertInvoiceDraft(
  admin: SupabaseClient,
  input: {
    businessId: string;
    createdByUserId: string;
    draft: ParsedInvoiceDraft;
  }
): Promise<InsertInvoiceDraftResult> {
  // `invoices` is not in the generated Database type yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { draft } = input;

  let invoiceId: string | null = null;
  let lastError: { message?: string; code?: string } | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await db
      .from('invoices')
      .insert({
        business_id: input.businessId,
        created_by_user_id: input.createdByUserId,
        status: 'draft',
        customer_name: draft.customerName,
        customer_email: draft.customerEmail,
        customer_phone: draft.customerPhone,
        note: draft.note,
        currency: 'usd',
        due_on: draft.dueOn,
        subtotal_cents: draft.subtotalCents,
        total_cents: draft.totalCents,
        public_token: createPublicToken(),
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      invoiceId = data.id as string;
      break;
    }

    lastError = error;
    if (error?.code !== '23505') break;
  }

  if (!invoiceId) {
    console.error('insert invoice draft:', lastError);
    return { ok: false, error: 'Could not save this draft.' };
  }

  const { error: lineError } = await db.from('invoice_line_items').insert(
    draft.lines.map(line => ({
      invoice_id: invoiceId,
      position: line.position,
      description: line.description,
      quantity: line.quantity,
      unit_amount_cents: line.unitAmountCents,
      amount_cents: line.amountCents,
    }))
  );

  if (lineError) {
    console.error('insert invoice lines:', lineError);
    await db.from('invoices').delete().eq('id', invoiceId);
    return { ok: false, error: 'Could not save this draft.' };
  }

  return { ok: true, invoiceId };
}
