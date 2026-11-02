import { voidInvoice } from '@/features/invoices/server/voidInvoice';
import { invoiceProRequiredResponse } from '@/features/invoices/server/requireInvoicePro';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

const INVOICE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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

    const voided = await voidInvoice(createSupabaseAdminClient(), {
      businessId: resolved.businessId,
      invoiceId: id,
    });

    if (!voided.ok) {
      return NextResponse.json(
        { success: false, error: voided.error },
        { status: voided.status }
      );
    }

    return NextResponse.json({ success: true, invoiceId: id });
  } catch (error) {
    console.error('invoices void:', error);
    return NextResponse.json(
      { success: false, error: 'Could not update this invoice.' },
      { status: 500 }
    );
  }
}
