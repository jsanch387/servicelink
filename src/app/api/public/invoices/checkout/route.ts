import { createCustomerInvoiceCheckout } from '@/features/invoices/server/createCustomerInvoiceCheckout';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicInvoiceCheckoutRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const raw: unknown = await request.json().catch(() => null);
  const shortCode =
    raw &&
    typeof raw === 'object' &&
    'shortCode' in raw &&
    typeof (raw as { shortCode?: unknown }).shortCode === 'string'
      ? (raw as { shortCode: string }).shortCode.trim()
      : '';

  if (!shortCode) {
    return NextResponse.json(
      { success: false, error: 'Invoice not found.' },
      { status: 400 }
    );
  }

  const limited = await assertPublicInvoiceCheckoutRateLimits(
    request,
    shortCode
  );
  if (limited) return limited;

  const result = await createCustomerInvoiceCheckout(
    createSupabaseAdminClient(),
    request,
    shortCode
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.httpStatus }
    );
  }

  if ('alreadyPaid' in result) {
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  return NextResponse.json({ success: true, url: result.url });
}
