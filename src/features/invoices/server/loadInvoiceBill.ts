import type { SupabaseClient } from '@supabase/supabase-js';

import type { PublicInvoiceBillModel } from '../components/PublicInvoiceBill';
import type { InvoiceStatus } from '../types';

const VIEWABLE: readonly InvoiceStatus[] = ['sent', 'paid', 'void'];

function isStatus(value: unknown): value is InvoiceStatus {
  return (
    value === 'draft' ||
    value === 'sent' ||
    value === 'paid' ||
    value === 'void'
  );
}

/**
 * Loads a sent, paid, or void invoice the signed-in shop can already select.
 */
export async function loadInvoiceBill(
  supabase: SupabaseClient,
  businessId: string,
  invoiceId: string
): Promise<PublicInvoiceBillModel | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: invoice, error } = await db
    .from('invoices')
    .select(
      'id, status, invoice_number, short_code, customer_name, customer_email, customer_phone, due_on, note, total_cents'
    )
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !invoice || !isStatus(invoice.status)) {
    if (error) console.error('load invoice bill:', error);
    return null;
  }
  if (!VIEWABLE.includes(invoice.status)) return null;
  if (typeof invoice.invoice_number !== 'number') return null;

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  const { data: lineRows, error: lineError } = await db
    .from('invoice_line_items')
    .select(
      'id, description, quantity, unit_amount_cents, amount_cents, position'
    )
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true });

  if (lineError || !Array.isArray(lineRows)) {
    console.error('load invoice bill lines:', lineError);
    return null;
  }

  return {
    businessName: business?.business_name?.trim() || 'Invoice',
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
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
    dueOn: typeof invoice.due_on === 'string' ? invoice.due_on : null,
    note: typeof invoice.note === 'string' ? invoice.note : null,
    totalCents: Number(invoice.total_cents) || 0,
    shortCode:
      typeof invoice.short_code === 'string' ? invoice.short_code : null,
    lines: lineRows.map(line => ({
      id: String(line.id),
      description: typeof line.description === 'string' ? line.description : '',
      quantity: Number(line.quantity) || 1,
      unitAmountCents: Number(line.unit_amount_cents) || 0,
      amountCents: Number(line.amount_cents) || 0,
    })),
  };
}
