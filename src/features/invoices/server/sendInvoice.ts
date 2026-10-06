import { getPublicBillPath } from '@/constants/routes';
import { generateInvoiceShortCode } from '@/features/availability/booking/server/generateInvoiceShortCode';
import { sendCustomerInvoiceEmail } from '@/features/email';
import { buildCustomerInvoiceSms } from '@/features/sms/messages/bookingSms';
import { sendAndRecordSms } from '@/features/sms/services/sendAndRecordSms';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { assertOwnerSmsSendRateLimits } from '@/server/rateLimit/ownerSmsSendRateLimit';
import type { NextRequest } from 'next/server';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import { allocateInvoiceNumber } from './allocateInvoiceNumber';
import { notifyOwnerInvoicePaid } from './notifyOwnerInvoicePaid';
import { insertInvoiceDraft } from './insertInvoiceDraft';
import { loadBookingPaymentCoverage } from './syncInvoiceWithBookingPayment';
import { updateInvoiceDraft } from './updateInvoiceDraft';
import type { ParsedInvoiceDraft } from '../utils/parseSaveInvoiceDraft';

type SendInvoiceResult =
  | {
      ok: true;
      invoiceId: string;
      invoiceNumber: number;
      shortUrl: string;
      emailAttempted: boolean;
      emailSent: boolean;
      emailError?: string;
      smsAttempted: boolean;
      smsSent: boolean;
      smsError?: string;
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
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  if (error) console.error('invoice business lookup:', error);

  const name = data?.business_name?.trim() || 'Your service provider';
  return { name, replyTo: null };
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
    bookingId?: string | null;
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
      bookingId: input.bookingId,
    });
    if (!updated.ok && updated.status !== 409) return updated;
  } else {
    const inserted = await insertInvoiceDraft(admin, {
      businessId: input.businessId,
      createdByUserId: input.createdByUserId,
      draft: input.draft,
      bookingId: input.bookingId,
    });
    if (!inserted.ok) return { ok: false, error: inserted.error, status: 500 };
    invoiceId = inserted.invoiceId;
  }

  const { data: existing, error: loadError } = await db
    .from('invoices')
    .select(
      'id, status, invoice_number, short_code, customer_email, customer_phone, customer_id, booking_id'
    )
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

  const linkedBookingId =
    (typeof existing.booking_id === 'string' && existing.booking_id) ||
    input.bookingId ||
    null;
  let alreadyPaid = existing.status === 'paid';
  if (linkedBookingId && !alreadyPaid) {
    const coverage = await loadBookingPaymentCoverage(admin, linkedBookingId);
    if (coverage.settled) {
      const { error: paidError } = await db
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: coverage.method,
        })
        .eq('id', invoiceId)
        .eq('business_id', input.businessId)
        .in('status', ['sent', 'paid']);
      if (paidError) {
        console.error('mark invoice paid from booking:', paidError);
      } else {
        alreadyPaid = true;
        await notifyOwnerInvoicePaid(admin, {
          businessId: input.businessId,
          invoiceId,
        });
      }
    }
  }

  const business = await loadBusiness(admin, input.businessId);
  const shortUrl = billUrl(shortCode, request);
  const email =
    input.draft.customerEmail ??
    (typeof existing.customer_email === 'string'
      ? existing.customer_email
      : '') ??
    '';
  const phone =
    input.draft.customerPhone ??
    (typeof existing.customer_phone === 'string'
      ? existing.customer_phone
      : '') ??
    '';

  let emailSent = false;
  let emailError: string | undefined;
  if (email) {
    const emailed = await sendCustomerInvoiceEmail({
      to: email,
      businessName: business.name,
      replyTo: business.replyTo,
      customerName: input.draft.customerName,
      invoiceNumber,
      totalCents: input.draft.totalCents,
      dueOn: input.draft.dueOn,
      invoiceUrl: shortUrl,
      paid: alreadyPaid,
    });
    emailSent = emailed.sent;
    emailError = emailed.sent ? undefined : emailed.error;
  }

  let smsSent = false;
  let smsError: string | undefined;
  if (phone) {
    const rate = await assertOwnerSmsSendRateLimits(
      request as NextRequest,
      input.createdByUserId
    );
    const customerId =
      typeof existing.customer_id === 'string' ? existing.customer_id : null;
    if (!rate.ok) {
      smsError = 'Too many texts. Try again in a little while.';
    } else {
      const texted = await sendAndRecordSms({
        admin: admin as SupabaseClient<Database>,
        businessId: input.businessId,
        bookingId: linkedBookingId,
        customerId,
        type: 'customer_invoice',
        to: phone,
        message: buildCustomerInvoiceSms({
          businessName: business.name,
          invoiceUrl: shortUrl,
        }),
        correlationId: invoiceId,
      });
      if (texted.sent) {
        smsSent = true;
      } else if (texted.reason === 'duplicate') {
        smsSent = true;
      } else {
        smsError = invoiceSmsError(texted.reason);
      }
    }
  }

  return {
    ok: true,
    invoiceId,
    invoiceNumber,
    shortUrl,
    emailAttempted: Boolean(email),
    emailSent,
    emailError,
    smsAttempted: Boolean(phone),
    smsSent,
    smsError,
  };
}

function invoiceSmsError(
  reason:
    | 'no_phone'
    | 'invalid_number'
    | 'duplicate'
    | 'not_configured'
    | 'not_eligible'
    | 'sms_opt_out'
    | 'carrier_opt_out'
    | 'error'
): string {
  if (reason === 'sms_opt_out' || reason === 'carrier_opt_out') {
    return 'This customer opted out of texts.';
  }
  if (reason === 'invalid_number' || reason === 'no_phone') {
    return 'Enter a valid phone number.';
  }
  if (reason === 'not_configured' || reason === 'not_eligible') {
    return 'Texting is not available for this account yet.';
  }
  return 'Could not text this invoice.';
}
