import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { loadPublicServicePriceOptions } from '@/features/business-profile/booking-link-v2/server/loadPublicServicePriceOptions';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { assertPublicProfileGetRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public/profile/[slug]/service-price-options?serviceId=
 * Active price tiles for the booking-link browse sheet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trimmedSlug = slug?.trim();
  const serviceId = request.nextUrl.searchParams.get('serviceId')?.trim();

  if (!trimmedSlug || !serviceId) {
    return NextResponse.json(
      { success: false, error: 'Slug and serviceId are required' },
      { status: 400 }
    );
  }

  try {
    const rateLimited = await assertPublicProfileGetRateLimits(
      request,
      trimmedSlug
    );
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(admin, trimmedSlug))) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('business_slug', trimmedSlug)
      .maybeSingle();
    const businessId = (profileData as { id?: string } | null)?.id?.trim();

    if (profileError || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const options = await loadPublicServicePriceOptions({
      businessId,
      serviceId,
    });

    return NextResponse.json({ success: true, options });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Could not load price options' },
      { status: 500 }
    );
  }
}
