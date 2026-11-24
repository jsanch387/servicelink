/**
 * GET /api/public/bookings/returning-customer?businessSlug=&phone=
 *
 * Fills the public booking details form when this phone already belongs to
 * the business. Returns contact and service address only.
 */

import { lookupReturningBookingCustomer } from '@/features/booking-v2/server/lookupReturningBookingCustomer';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicBookingCustomerLookupRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const businessSlug =
    request.nextUrl.searchParams.get('businessSlug')?.trim().toLowerCase() ??
    '';
  const phone = request.nextUrl.searchParams.get('phone')?.trim() ?? '';

  if (!businessSlug || !phone) {
    return NextResponse.json(
      { success: false, error: 'businessSlug and phone are required' },
      { status: 400, headers: noStore }
    );
  }

  const rateLimited = await assertPublicBookingCustomerLookupRateLimits(
    request,
    businessSlug
  );
  if (rateLimited) return rateLimited;

  const supabase = createSupabaseAdminClient();
  if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404, headers: noStore }
    );
  }

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_slug', businessSlug)
    .maybeSingle();
  const businessId = (profile as { id?: string } | null)?.id?.trim();
  if (!businessId) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404, headers: noStore }
    );
  }

  try {
    const customer = await lookupReturningBookingCustomer(supabase, {
      businessId,
      phone,
    });
    return NextResponse.json({ success: true, customer }, { headers: noStore });
  } catch (error) {
    console.error('[public/bookings/returning-customer]', error);
    return NextResponse.json(
      { success: false, error: 'Could not look up details.' },
      { status: 500, headers: noStore }
    );
  }
}
