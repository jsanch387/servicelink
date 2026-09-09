import { loadPublicGalleryImages } from '@/features/business-profile/server/loadPublicGalleryImages';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { assertPublicProfileGetRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/public/profile/[slug]/gallery
 * Portfolio images — fetched when the customer opens the Gallery tab.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json(
      { success: false, error: 'Slug is required' },
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

    const images = await loadPublicGalleryImages(admin, businessId);

    return NextResponse.json({ success: true, data: { images } });
  } catch (err) {
    console.error('[gallery] GET public profile gallery failed', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
