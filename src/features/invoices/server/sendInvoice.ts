import { getPublicBillPath } from '@/constants/routes';
import { generateInvoiceShortCode } from '@/features/availability/booking/server/generateInvoiceShortCode';
import { sendCustomerInvoiceEmail } from '@/features/email';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import type { SupabaseClient } from '@supabase/supabase-js';

import { allocateInvoiceNumber } from './allocateInvoiceNumber';
import { insertInvoiceDraft } from './insertInvoiceDraft';
import { updateInvoiceDraft } from './updateInvoiceDraft';
import type { ParsedInvoiceDraft } from '../utils/parseSaveInvoiceDraft';

type SendInvoiceResult =
  | {
      ok: true;
      invoiceId: string;
      invoiceNumber: number;
      shortUrl: string;
      emailSent: boolean;
      emailError?: string;
    }
  | { ok: false; error: string; status: number; invoiceId?: string };

function billUrl(shortCode: string, request: Request): string {
  return `${getAppBaseUrl(request)}${getPublicBillPath(shortCode)}`;
}

async function loadBusiness(
  admin: SupabaseClient,
  businessId: string
): Promise<{ name: string; replyTo: string | null }> {
  const { data, error } = await admin
    .from('business_profiles')
    .select('business_name, email')
    .eq('id', businessId)
    .maybeSingle();

  if (error) console.error('invoice business lookup:', error);

  const name = data?.business_name?.trim() || 'Your service provider';
  const replyTo = data?.email?.trim() || null;
  return { name, replyTo };
}

/**
 * Publishes a draft (number + short link) and emails that link.
 * A second send of the same invoice emails the existing link again.
 */
export async function sendInvoice(
  admin: SupabaseClient,
  request: Request,
  input: {
    businessId: string;
    createdByUserId: string;
    invoiceId: string | null;
    draft: ParsedInvoiceDraft;
  }
): Promise<SendInvoiceResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  let invoiceId = input.invoiceId;

  if (invoiceId) {
    const updated = await updateInvoiceDraft(admin, {
      businessId: input.businessId,
      invoiceId,
      draft: input.draft,
    });
    if (!updated.ok && updated.status !== 409) return updated;
  } else {
    const inserted = await insertInvoiceDraft(admin, {
      businessId: input.businessId,
      createdByUserId: input.createdByUserId,
      draft: input.draft,
    });
    if (!inserted.ok) return { ok: false, error: inserted.error, status: 500 };
    invoiceId = inserted.invoiceId;
  }

  const { data: existing, error: loadError } = await db
    .from('invoices')
    .select('id, status, invoice_number, short_code, customer_email')
    .eq('id', invoiceId)
    .eq('business_id', input.businessId)
    .maybeSingle();

  if (loadError || !existing) {
    console.error('load invoice to send:', loadError);
    return {
      ok: false,
      error: 'Could not send this invoice.',
      status: 500,
      invoiceId,
    };
  }

  if (existing.status === 'void') {
    return {
      ok: false,
      error: 'This invoice can no longer be sent.',
      status: 409,
      invoiceId,
    };
  }

  let invoiceNumber = existing.invoice_number as number | null;
  let shortCode = (existing.short_code as string | null)?.trim() || null;

  if (existing.status === 'draft') {
    const allocated = await allocateInvoiceNumber(admin, input.businessId);
    if (allocated === null) {
      return {
        ok: false,
        error: 'Could not send this invoice.',
        status: 500,
        invoiceId,
      };
    }

    let published = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateInvoiceShortCode();
      const { data: row, error } = await db
        .from('invoices')
        .update({
          invoice_number: allocated,
          short_code: code,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('business_id', input.businessId)
        .eq('status', 'draft')
        .select('id')
        .maybeSingle();

      if (!error && row?.id) {
        invoiceNumber = allocated;
        shortCode = code;
        published = true;
        break;
      }
      const shortCodeTaken =
        error?.code === '23505' &&
        String(error.message ?? '').includes('short_code');
      if (!shortCodeTaken) {
        console.error('publish invoice:', error);
        return {
          ok: false,
          error: 'Could not send this invoice.',
          status: 500,
          invoiceId,
        };
      }
    }

    if (!published || !shortCode || invoiceNumber === null) {
      return {
        ok: false,
        error: 'Could not send this invoice.',
        status: 500,
        invoiceId,
      };
    }
  }

  if (!shortCode || invoiceNumber === null) {
    return {
      ok: false,
      error: 'Could not send this invoice.',
      status: 500,
      invoiceId,
    };
  }

  const business = await loadBusiness(admin, input.businessId);
  const shortUrl = billUrl(shortCode, request);
  const emailed = await sendCustomerInvoiceEmail({
    to: input.draft.customerEmail ?? existing.customer_email ?? '',
    businessName: business.name,
    replyTo: business.replyTo,
    customerName: input.draft.customerName,
    invoiceNumber,
    totalCents: input.draft.totalCents,
    dueOn: input.draft.dueOn,
    invoiceUrl: shortUrl,
  });

  return {
    ok: true,
    invoiceId,
    invoiceNumber,
    shortUrl,
    emailSent: emailed.sent,
    emailError: emailed.sent ? undefined : emailed.error,
  };
}
