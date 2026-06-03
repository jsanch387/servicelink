import { submitPublicReview } from '@/features/reviews/server/submitPublicReview';
import { validateSubmitReviewBody } from '@/features/reviews/server/validateSubmitReviewBody';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validated = validateSubmitReviewBody(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const result = await submitPublicReview(admin, validated.value);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] POST /api/public/reviews/submit', err);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
