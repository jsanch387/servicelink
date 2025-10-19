/**
 * Public API Endpoint: Get Business Profile by Slug
 *
 * GET /api/public/profile/[slug]
 *
 * Fetches a business profile by its slug without requiring authentication.
 * Used for public profile viewing.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
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

    // Get business profile by slug
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('business_slug', slug)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('business_services')
      .select('*')
      .eq('business_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (servicesError) {
      // Services fetch failed, continue with empty array
    }

    // Get portfolio images
    const { data: images, error: imagesError } = await supabase
      .from('business_images')
      .select('*')
      .eq('business_id', profile.id)
      .order('position', { ascending: true });

    if (imagesError) {
      // Images fetch failed, continue with empty array
    }

    // Construct complete business profile response
    const completeProfile = {
      ...profile,
      services: services || [],
      images: images || [],
    };

    return NextResponse.json({
      success: true,
      data: completeProfile,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
