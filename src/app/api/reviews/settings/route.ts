import {
  getReviewRequestDestination,
  parseReviewRequestDestination,
  setReviewRequestDestination,
  type ReviewRequestDestination,
} from '@/features/reviews/server/reviewRequestDestination';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(supabase, 'reviews.read');
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const loaded = await getReviewRequestDestination(resolved.businessId);
    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviewRequestDestination: loaded.destination,
    });
  } catch (error) {
    console.error('[reviews] GET settings failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not load review settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(supabase, 'reviews.write');
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const raw = (body as { reviewRequestDestination?: unknown })
      ?.reviewRequestDestination;
    if (raw !== 'servicelink' && raw !== 'google') {
      return NextResponse.json(
        {
          success: false,
          error: 'reviewRequestDestination must be servicelink or google',
        },
        { status: 400 }
      );
    }

    const destination: ReviewRequestDestination =
      parseReviewRequestDestination(raw);
    const saved = await setReviewRequestDestination(
      resolved.businessId,
      destination
    );
    if (!saved.ok) {
      return NextResponse.json(
        { success: false, error: saved.error },
        { status: saved.status }
      );
    }

    return NextResponse.json({
      success: true,
      reviewRequestDestination: destination,
    });
  } catch (error) {
    console.error('[reviews] PATCH settings failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not save review settings.' },
      { status: 500 }
    );
  }
}
