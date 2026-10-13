import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export const EXPENSE_PRO_REQUIRED_ERROR =
  'Expenses are a Pro feature. Upgrade to Pro to track expenses.';

export async function businessCanUseExpenses(
  businessId: string
): Promise<boolean> {
  return ownerHasProAccessForBusiness(createSupabaseAdminClient(), businessId);
}

/** 403 when this shop is not on Pro. Null when expenses are allowed. */
export async function expenseProRequiredResponse(
  businessId: string
): Promise<NextResponse | null> {
  const allowed = await businessCanUseExpenses(businessId);
  if (allowed) return null;
  return NextResponse.json(
    { success: false, error: EXPENSE_PRO_REQUIRED_ERROR },
    { status: 403 }
  );
}
