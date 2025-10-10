/**
 * API Route: Check Slug Availability
 *
 * GET /api/business-profile/slug/check?slug=example-slug
 * Returns whether a slug is available for use
 */

import { slugService } from '@/features/business-profile/services/slugService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log(
    '🔍 [API] GET /api/business-profile/slug/check - Checking slug availability'
  );

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      console.log('❌ [API] Missing slug parameter');
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    console.log('📝 [API] Checking availability for slug:', slug);

    // Validate the slug format first
    const validation = slugService.validateSlug(slug);
    if (!validation.isValid) {
      console.log('❌ [API] Slug validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Check availability
    const availability = await slugService.checkSlugAvailability(
      validation.cleanSlug!
    );

    if (!availability.isAvailable) {
      console.log('❌ [API] Slug not available:', availability.error);
      return NextResponse.json(
        { success: false, error: availability.error },
        { status: 409 } // Conflict
      );
    }

    console.log('✅ [API] Slug is available:', validation.cleanSlug);

    return NextResponse.json({
      success: true,
      data: {
        slug: validation.cleanSlug,
        isAvailable: true,
      },
    });
  } catch (error) {
    console.error(
      '❌ [API] Unexpected error checking slug availability:',
      error
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
