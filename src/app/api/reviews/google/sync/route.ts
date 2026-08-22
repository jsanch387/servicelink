import { syncGoogleBusinessListing } from '@/features/reviews/google-connect/server/syncGoogleBusinessListing';
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

    const synced = await syncGoogleBusinessListing(resolved.businessId);
    if (!synced.ok) {
      return NextResponse.json(
        { success: false, error: synced.error },
        { status: synced.status }
      );
    }

    return NextResponse.json({
      success: true,
      locationTitle: synced.locationTitle,
      foundLocation: synced.foundLocation,
    });
  } catch (error) {
    console.error('[reviews:google-connect] POST sync failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not find your Google listing.' },
      { status: 500 }
    );
  }
}
