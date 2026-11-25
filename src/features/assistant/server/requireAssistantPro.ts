import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

export const ASSISTANT_PRO_REQUIRED_ERROR =
  'Assistant is included with Pro. Upgrade to send follow-ups and ask about your shop.';

export const ASSISTANT_PRO_REQUIRED_CODE = 'pro_required';

export async function businessCanUseAssistant(
  businessId: string
): Promise<boolean> {
  return ownerHasProAccessForBusiness(createSupabaseAdminClient(), businessId);
}

/** 403 when this shop is not on Pro. Null when Assistant actions are allowed. */
export async function assistantProRequiredResponse(
  businessId: string
): Promise<NextResponse | null> {
  const allowed = await businessCanUseAssistant(businessId);
  if (allowed) return null;
  return NextResponse.json(
    {
      success: false,
      error: ASSISTANT_PRO_REQUIRED_ERROR,
      code: ASSISTANT_PRO_REQUIRED_CODE,
    },
    { status: 403 }
  );
}
