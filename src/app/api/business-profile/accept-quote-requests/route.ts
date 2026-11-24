/**
 * PATCH /api/business-profile/accept-quote-requests
 * Owner toggles `business_profiles.accept_quote_req` (public Request quote + intake).
 */

import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const resolved = await requireBusinessPermission(supabase, 'profile.write');
  if (!resolved.ok) {
    return NextResponse.json(
      { success: false, error: resolved.error },
      { status: resolved.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const raw = body as { acceptQuoteRequests?: unknown };
  if (typeof raw.acceptQuoteRequests !== 'boolean') {
    return NextResponse.json(
      {
        success: false,
        error: 'acceptQuoteRequests must be a boolean',
      },
      { status: 400 }
    );
  }

  const acceptQuoteRequests = raw.acceptQuoteRequests;

  if (acceptQuoteRequests) {
    const hasPro = await ownerHasProAccessForBusiness(
      createSupabaseAdminClient(),
      resolved.businessId
    );
    if (!hasPro) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pro subscription required to enable quote requests',
        },
        { status: 403 }
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('business_profiles')
    .update({ accept_quote_req: acceptQuoteRequests })
    .eq('id', resolved.businessId);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    acceptQuoteRequests,
  });
}
