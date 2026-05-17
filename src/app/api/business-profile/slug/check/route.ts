/**
 * API Route: Check Slug Availability
 *
 * GET /api/business-profile/slug/check?slug=example-slug
 * Returns whether a slug is available for use
 */

import { SlugService } from '@/features/business-profile/services/slugService';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const slugServiceForRequest = new SlugService(supabase);

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const validation = slugServiceForRequest.validateSlug(slug);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Check availability
    const availability = await slugServiceForRequest.checkSlugAvailability(
      validation.cleanSlug!
    );

    if (!availability.isAvailable) {
      return NextResponse.json(
        { success: false, error: availability.error },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        slug: validation.cleanSlug,
        isAvailable: true,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
