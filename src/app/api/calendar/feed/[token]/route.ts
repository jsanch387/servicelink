/**
 * GET /api/calendar/feed/[token]
 *
 * Public ICS calendar for a business (signed token). Used by phone calendar
 * “subscribe” flows (`https://` or `webcal://`).
 */

import { buildBookingsIcs } from '@/features/calendar-sync/server/buildBookingsIcs';
import { verifyCalendarFeedToken } from '@/features/calendar-sync/server/calendarFeedToken';
import { listBookingsForCalendarFeed } from '@/features/calendar-sync/services/listBookingsForCalendarFeed';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertCalendarFeedIcsRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function calendarDomainFromRequest(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    'localhost';
  return host.split(':')[0] ?? 'localhost';
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await context.params;
    const token = decodeURIComponent(rawToken ?? '').trim();

    const rateLimited = await assertCalendarFeedIcsRateLimits(request, token);
    if (rateLimited) return rateLimited;

    const businessId = verifyCalendarFeedToken(token);
    if (!businessId) {
      return new NextResponse('Not found', { status: 404 });
    }

    const admin = createSupabaseAdminClient();

    const { data: business, error: bizError } = await admin
      .from('business_profiles')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle();

    if (bizError || !business) {
      return new NextResponse('Not found', { status: 404 });
    }

    const rows = await listBookingsForCalendarFeed(admin, businessId);
    const businessName =
      (business as { business_name?: string | null }).business_name?.trim() ||
      'My business';

    const ics = buildBookingsIcs(rows, {
      businessName,
      calendarDomain: calendarDomainFromRequest(request),
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[API] GET /api/calendar/feed/[token]:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
