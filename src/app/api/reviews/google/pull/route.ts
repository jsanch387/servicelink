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

    const resolved = await resolveCurrentBusinessId(auth.supabase);
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
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
