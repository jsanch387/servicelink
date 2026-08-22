import { loadGoogleBusinessConnectionStatus } from '@/features/reviews/google-connect/server/loadGoogleBusinessConnectionStatus';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const loaded = await loadGoogleBusinessConnectionStatus(resolved.businessId);
    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: loaded.status.connected,
      locationTitle: loaded.status.locationTitle,
    });
  } catch (error) {
    console.error('[reviews:google-connect] GET status failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not load Google connection.' },
      { status: 500 }
    );
  }
}
