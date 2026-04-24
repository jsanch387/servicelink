/**
 * GET /api/calendar/feed/link
 *
 * Authenticated owner: returns signed feed token and ready-to-use subscribe URLs.
 */

import { API_ROUTES } from '@/constants/routes';
import { signCalendarFeedToken } from '@/features/calendar-sync/server/calendarFeedToken';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import {
  assertCalendarFeedLinkProbeRateLimits,
  assertCalendarFeedLinkRateLimits,
} from '@/server/rateLimit/publicApiRateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function absoluteBaseUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    'localhost:3000';
  return `${proto}://${host}`;
}

async function getAuthAndBusinessId(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 as const };
  }

  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (businessError || !businessProfile) {
    return { error: 'Business profile not found', status: 404 as const };
  }

  return {
    businessId: businessProfile.id as string,
    userId: user.id,
  };
}

export async function GET(request: NextRequest) {
  try {
    const probeLimited = await assertCalendarFeedLinkProbeRateLimits(request);
    if (probeLimited) return probeLimited;

    const supabase = await createSupabaseServerClient();
    const auth = await getAuthAndBusinessId(supabase);
    if ('status' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const authedLimited = await assertCalendarFeedLinkRateLimits(
      request,
      auth.userId
    );
    if (authedLimited) return authedLimited;

    const token = signCalendarFeedToken(auth.businessId);
    const base = absoluteBaseUrl(request);
    const path = API_ROUTES.CALENDAR_FEED(token);
    const httpsUrl = `${base}${path}`;
    const hostHeader =
      request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      'localhost:3000';
    const webcalUrl = `webcal://${hostHeader}${path}`;

    return NextResponse.json({
      success: true,
      data: { token, httpsUrl, webcalUrl },
    });
  } catch (err) {
    console.error('[API] GET /api/calendar/feed/link:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to build calendar link' },
      { status: 500 }
    );
  }
}
