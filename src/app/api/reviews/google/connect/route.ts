import { startGoogleBusinessConnect } from '@/features/reviews/google-connect/server/startGoogleBusinessConnect';
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

    let client: 'web' | 'mobile' = 'web';
    try {
      const body = (await request.json()) as { client?: unknown };
      if (body?.client === 'mobile') client = 'mobile';
    } catch {
      client = 'web';
    }

    const started = startGoogleBusinessConnect({
      request,
      userId: auth.user.id,
      businessId: resolved.businessId,
      client,
    });

    if (!started.ok) {
      return NextResponse.json(
        { success: false, error: started.error },
        { status: started.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      url: started.url,
    });
    response.cookies.set(started.cookie);
    return response;
  } catch (error) {
    console.error('[reviews:google-connect] POST failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not start Google connect.' },
      { status: 500 }
    );
  }
}
