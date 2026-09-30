import { readInvoiceBookingId } from '@/features/invoices/server/loadInvoiceDraftFromBooking';
import { sendInvoice } from '@/features/invoices/server/sendInvoice';
import { invoiceProRequiredResponse } from '@/features/invoices/server/requireInvoicePro';
import { parseSendInvoiceDraft } from '@/features/invoices/utils/parseSaveInvoiceDraft';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

const INVOICE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'invoices.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const proDenied = await invoiceProRequiredResponse(resolved.businessId);
    if (proDenied) return proDenied;

    const json: unknown = await request.json().catch(() => null);
    const parsed = parseSendInvoiceDraft(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const rawId =
      json && typeof json === 'object' && 'invoiceId' in json
        ? (json as { invoiceId?: unknown }).invoiceId
        : null;
    const invoiceId =
      typeof rawId === 'string' && INVOICE_ID.test(rawId.trim())
        ? rawId.trim()
        : null;

    const bookingId =
      json && typeof json === 'object' && 'bookingId' in json
        ? readInvoiceBookingId((json as { bookingId?: unknown }).bookingId)
        : null;

    const sent = await sendInvoice(createSupabaseAdminClient(), request, {
      businessId: resolved.businessId,
      createdByUserId: resolved.context.userId,
      invoiceId,
      draft: parsed.data,
      bookingId,
    });

    if (!sent.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sent.error,
          invoiceId: sent.invoiceId ?? null,
        },
        { status: sent.status }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceId: sent.invoiceId,
      invoiceNumber: sent.invoiceNumber,
      shortUrl: sent.shortUrl,
      emailAttempted: sent.emailAttempted,
      emailSent: sent.emailSent,
      emailError: sent.emailError ?? null,
      smsAttempted: sent.smsAttempted,
      smsSent: sent.smsSent,
      smsError: sent.smsError ?? null,
    });
  } catch (error) {
    console.error('invoices send POST:', error);
    return NextResponse.json(
      { success: false, error: 'Could not send this invoice.' },
      { status: 500 }
    );
  }
}
