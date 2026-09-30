import { buildInvoicePdf } from '@/features/invoices/server/buildInvoicePdf';
import { loadInvoiceBill } from '@/features/invoices/server/loadInvoiceBill';
import { invoiceProRequiredResponse } from '@/features/invoices/server/requireInvoicePro';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

const INVOICE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
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

    const bill = await loadInvoiceBill(auth.supabase, resolved.businessId, id);
    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found.' },
        { status: 404 }
      );
    }

    const pdf = await buildInvoicePdf(bill);
    const filename = `Invoice-${bill.invoiceNumber}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('invoice pdf:', error);
    return NextResponse.json(
      { success: false, error: 'Could not download this invoice.' },
      { status: 500 }
    );
  }
}
