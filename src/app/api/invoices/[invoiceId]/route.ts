import { readInvoiceBookingId } from '@/features/invoices/server/loadInvoiceDraftFromBooking';
import { updateInvoiceDraft } from '@/features/invoices/server/updateInvoiceDraft';
import { invoiceProRequiredResponse } from '@/features/invoices/server/requireInvoicePro';
import { parseSaveInvoiceDraft } from '@/features/invoices/utils/parseSaveInvoiceDraft';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

const INVOICE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { invoiceId } = await context.params;
    const id = invoiceId?.trim() ?? '';
    if (!INVOICE_ID.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

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
    const parsed = parseSaveInvoiceDraft(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const bookingId =
      json && typeof json === 'object' && 'bookingId' in json
        ? readInvoiceBookingId((json as { bookingId?: unknown }).bookingId)
        : null;

    const saved = await updateInvoiceDraft(createSupabaseAdminClient(), {
      businessId: resolved.businessId,
      invoiceId: id,
      draft: parsed.data,
      bookingId,
    });

    if (!saved.ok) {
      return NextResponse.json(
        { success: false, error: saved.error },
        { status: saved.status }
      );
    }

    return NextResponse.json({ success: true, invoiceId: id });
  } catch (error) {
    console.error('invoices PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save this draft.' },
      { status: 500 }
    );
  }
}
