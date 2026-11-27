import { disconnectGoogleBusinessConnection } from '@/features/reviews/google-connect/server/disconnectGoogleBusinessConnection';
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

    const disconnected = await disconnectGoogleBusinessConnection(
      resolved.businessId
    );
    if (!disconnected.ok) {
      return NextResponse.json(
        { success: false, error: disconnected.error },
        { status: disconnected.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[reviews:google-connect] POST disconnect failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not disconnect Google.' },
      { status: 500 }
    );
  }
}
