import { mapInvoiceListRow } from '@/features/invoices/server/mapInvoiceListRow';
import { insertInvoiceDraft } from '@/features/invoices/server/insertInvoiceDraft';
import { parseSaveInvoiceDraft } from '@/features/invoices/utils/parseSaveInvoiceDraft';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
      'invoices.read'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (auth.supabase as any)
      .from('invoices')
      .select(
        'id, status, customer_name, total_cents, due_on, created_at, invoice_number'
      )
      .eq('business_id', resolved.businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('invoices GET:', error);
      return NextResponse.json(
        { success: false, error: 'Could not load invoices.' },
        { status: 500 }
      );
    }

    const invoices = (Array.isArray(data) ? data : [])
      .map(row => mapInvoiceListRow(row))
      .filter(row => row !== null);

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('invoices GET:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load invoices.' },
      { status: 500 }
    );
  }
}

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

    const json: unknown = await request.json().catch(() => null);
    const parsed = parseSaveInvoiceDraft(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const saved = await insertInvoiceDraft(createSupabaseAdminClient(), {
      businessId: resolved.businessId,
      createdByUserId: resolved.context.userId,
      draft: parsed.data,
    });

    if (!saved.ok) {
      return NextResponse.json(
        { success: false, error: saved.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoiceId: saved.invoiceId });
  } catch (error) {
    console.error('invoices POST:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save this draft.' },
      { status: 500 }
    );
  }
}
