/**
 * PATCH /api/business-profile/accept-quote-requests
 * Owner toggles `business_profiles.accept_quote_req` (public Request quote + intake).
 */

import { isProAccess } from '@/features/pricing';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const resolved = await resolveCurrentBusinessId(supabase);
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { data: profileRow } = await (supabase as any)
      .from('profiles')
      .select('subscription_tier, subscription_current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    const tier = profileRow?.subscription_tier as string | null | undefined;
    const periodEnd = profileRow?.subscription_current_period_end as
      | string
      | null
      | undefined;
    if (!isProAccess(tier, periodEnd)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pro subscription required to enable quote requests',
        },
        { status: 403 }
      );
    }
  }

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
