/**
 * POST /api/meta/instagram/connect
 *
 * Starts Facebook OAuth for Instagram DM automation (Page + IG professional account).
 * Auth: Supabase session (web cookies).
 */

import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { buildMetaOAuthAuthorizeUrl } from '@/services/meta/metaOAuthConfig';
import { createMetaOAuthState } from '@/services/meta/metaOAuthState';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[meta:instagram-connect]';

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.META_APP_ID?.trim() ||
      !process.env.META_APP_SECRET?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Instagram connect is not configured (missing META_APP_ID or META_APP_SECRET).',
        },
        { status: 500 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(auth.supabase);
    if (!businessResolved.ok) {
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const state = createMetaOAuthState({
      businessId: businessResolved.businessId,
      userId: auth.user.id,
    });

    const url = buildMetaOAuthAuthorizeUrl({ request, state });

    console.log(`${LOG} redirect prepared`, {
      businessId: businessResolved.businessId,
      userId: auth.user.id,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error(`${LOG} failed`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not start Instagram connect',
      },
      { status: 500 }
    );
  }
}
