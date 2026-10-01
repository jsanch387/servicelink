import { isValidInvoiceShortCode } from '@/features/availability/booking/server/generateInvoiceShortCode';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { PublicInvoiceBillModel } from '../components/PublicInvoiceBill';
import type { InvoiceStatus } from '../types';
import { CUSTOMER_INVOICE_CARD_MIN_CENTS } from './applyCustomerInvoiceCheckoutCompleted';

const VIEWABLE: readonly InvoiceStatus[] = ['sent', 'paid', 'void'];

function isStatus(value: unknown): value is InvoiceStatus {
  return (
    value === 'draft' ||
    value === 'sent' ||
    value === 'paid' ||
    value === 'void'
  );
}

export async function loadPublicInvoiceByShortCode(
  admin: SupabaseClient,
  shortCode: string
): Promise<PublicInvoiceBillModel | null> {
  const code = shortCode.trim();
  if (!isValidInvoiceShortCode(code)) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data: invoice, error } = await db
    .from('invoices')
    .select(
      'id, business_id, status, invoice_number, customer_name, customer_email, customer_phone, due_on, note, total_cents'
    )
    .eq('short_code', code)
    .maybeSingle();

  if (error || !invoice || !isStatus(invoice.status)) return null;
  if (!VIEWABLE.includes(invoice.status)) return null;
  if (typeof invoice.invoice_number !== 'number') return null;

  const { data: business } = await admin
    .from('business_profiles')
    .select('business_name')
    .eq('id', invoice.business_id)
    .maybeSingle();

  const { data: lineRows, error: lineError } = await db
    .from('invoice_line_items')
    .select(
      'id, description, quantity, unit_amount_cents, amount_cents, position'
    )
    .eq('invoice_id', invoice.id)
    .order('position', { ascending: true });

  if (lineError || !Array.isArray(lineRows)) return null;

  const totalCents = Number(invoice.total_cents) || 0;

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
    totalCents,
    canPay: await invoiceCanAcceptCardPayment(admin, {
      businessId: String(invoice.business_id),
      status: invoice.status,
      totalCents,
    }),
    lines: lineRows.map(line => ({
      id: String(line.id),
      description: typeof line.description === 'string' ? line.description : '',
      quantity: Number(line.quantity) || 1,
      unitAmountCents: Number(line.unit_amount_cents) || 0,
      amountCents: Number(line.amount_cents) || 0,
    })),
  };
}

async function invoiceCanAcceptCardPayment(
  admin: SupabaseClient,
  invoice: { businessId: string; status: InvoiceStatus; totalCents: number }
): Promise<boolean> {
  if (
    invoice.status !== 'sent' ||
    invoice.totalCents < CUSTOMER_INVOICE_CARD_MIN_CENTS
  ) {
    return false;
  }

  const { data, error } = await paymentAccountsOf(
    admin as SupabaseClient<Database>
  )
    .select('stripe_account_id, charges_enabled, onboarding_status')
    .eq('business_id', invoice.businessId)
    .maybeSingle();

  if (error || !data) return false;

  const stripeAccountId =
    typeof data.stripe_account_id === 'string'
      ? data.stripe_account_id.trim()
      : '';

  return (
    stripeAccountId.length > 0 &&
    data.charges_enabled === true &&
    data.onboarding_status === 'complete'
  );
}
