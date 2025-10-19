/**
 * API Route: Business Profile Slug Management
 *
 * Endpoints:
 * POST /api/business-profile/slug - Create/update business slug
 * GET /api/business-profile/slug/[businessId] - Get existing slug
 * GET /api/business-profile/slug/check/[slug] - Check slug availability
 */

import { slugService } from '@/features/business-profile/services/slugService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/business-profile/slug - Create business slug
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

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

    // Parse request body
    const body = await request.json();
    const { businessProfileId, slugInput } = body;

    if (!businessProfileId || !slugInput) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business profile ID and slug input are required',
        },
        { status: 400 }
      );
    }

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Create the slug using the service
    const result = await slugService.createBusinessSlug(
      businessProfileId,
      slugInput
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        slug: result.data!.slug,
        fullLink: result.data!.fullLink,
        businessProfileId: result.data!.businessProfileId,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/business-profile/slug/[businessId] - Get existing slug
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

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

    // Get business profile ID from query params
    const { searchParams } = new URL(request.url);
    const businessProfileId = searchParams.get('businessProfileId');

    if (!businessProfileId) {
      return NextResponse.json(
        { success: false, error: 'Business profile ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_name, business_slug, business_link')
      .eq('id', businessProfileId)
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    if (!profile.business_slug || !profile.business_link) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        slug: profile.business_slug,
        fullLink: profile.business_link,
        businessProfileId: profile.id,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
