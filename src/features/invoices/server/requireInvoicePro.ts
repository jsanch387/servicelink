import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export const INVOICE_PRO_REQUIRED_ERROR =
  'Invoices are a Pro feature. Upgrade to Pro to send invoices.';

export async function businessCanUseInvoices(
  businessId: string
): Promise<boolean> {
  return ownerHasProAccessForBusiness(createSupabaseAdminClient(), businessId);
}

/** 403 when this shop is not on Pro. Null when invoicing is allowed. */
export async function invoiceProRequiredResponse(
  businessId: string
): Promise<NextResponse | null> {
  const allowed = await businessCanUseInvoices(businessId);
  if (allowed) return null;
  return NextResponse.json(
    { success: false, error: INVOICE_PRO_REQUIRED_ERROR },
    { status: 403 }
  );
}
