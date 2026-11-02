import {
  GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE,
  googleReviewPullRetryAfterSec,
} from '@/features/reviews/google-connect/googleReviewPullCooldown';
import { isGoogleReviewsRolloutEmail } from '@/features/reviews/google-connect/googleReviewsRolloutAllowlist';
import { loadGoogleBusinessConnectionStatus } from '@/features/reviews/google-connect/server/loadGoogleBusinessConnectionStatus';
import { pullGoogleBusinessReviews } from '@/features/reviews/google-connect/server/pullGoogleBusinessReviews';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    if (!isGoogleReviewsRolloutEmail(auth.user.email)) {
      return NextResponse.json(
        { success: false, error: 'Google reviews are not available yet.' },
        { status: 403 }
      );
    }

    const resolved = await resolveCurrentBusinessId(auth.supabase);
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const status = await loadGoogleBusinessConnectionStatus(resolved.businessId);
    if (!status.ok) {
      return NextResponse.json(
        { success: false, error: status.error },
        { status: 500 }
      );
    }

    const retryAfterSec = googleReviewPullRetryAfterSec(
      status.status.lastSyncedAt
    );
    if (retryAfterSec > 0) {
      return NextResponse.json(
        { success: false, error: GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    const pulled = await pullGoogleBusinessReviews(resolved.businessId);
    if (!pulled.ok) {
      return NextResponse.json(
        { success: false, error: pulled.error },
        { status: pulled.status }
      );
    }

    return NextResponse.json({
      success: true,
      importedCount: pulled.importedCount,
    });
  } catch (error) {
    console.error('[reviews:google-connect] POST pull failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not pull Google reviews.' },
      { status: 500 }
    );
  }
}
