import {
  clientIpFromRequest,
  metaClickCookiesFromRequest,
  sendMetaCapiEvent,
} from '@/features/analytics/server/sendMetaCapiEvent';
import { completeRegistrationEventId } from '@/features/analytics/utils/metaPixel';
import { saveSignupAttribution } from '@/features/marketing-attribution/server/saveSignupAttribution';
import { parseMarketingAttributionFromBody } from '@/features/marketing-attribution/server/parseMarketingAttribution';
import { assertSignupAttributionRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/attribution/signup
 * Write-once first-touch attribution for new signups (authenticated).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
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

    const rateLimited = await assertSignupAttributionRateLimits(
      request,
      user.id
    );
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as Record<string, unknown>;
    const result = await saveSignupAttribution(supabase, user.id, body);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    let eventId: string | undefined;
    if (result.recorded) {
      eventId = completeRegistrationEventId(user.id);
      const attribution = parseMarketingAttributionFromBody(body);
      const clickCookies = metaClickCookiesFromRequest(request.headers);
      void sendMetaCapiEvent({
        eventName: 'CompleteRegistration',
        eventId,
        eventSourceUrl: 'https://myservicelink.app/',
        email: user.email,
        userId: user.id,
        clientIp: clientIpFromRequest(request.headers),
        userAgent: request.headers.get('user-agent'),
        fbp: clickCookies.fbp,
        fbc: clickCookies.fbc,
        fbclid: attribution.fbclid,
      }).catch(error => {
        console.error(
          '[MarketingAttribution] CAPI CompleteRegistration',
          error
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: { recorded: result.recorded, eventId },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
