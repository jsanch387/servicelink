import { ROUTES } from '@/constants/routes';
import { isGoogleReviewsRolloutEmail } from '@/features/reviews/google-connect/googleReviewsRolloutAllowlist';
import { exchangeGoogleBusinessCode } from '@/features/reviews/google-connect/server/exchangeGoogleBusinessCode';
import { fetchGoogleBusinessLocationPick } from '@/features/reviews/google-connect/server/fetchGoogleBusinessLocations';
import {
  getGoogleBusinessOAuthConfig,
  getGoogleBusinessRedirectUri,
  GOOGLE_CONNECT_STATE_COOKIE,
} from '@/features/reviews/google-connect/server/googleBusinessOAuth';
import {
  googleConnectReturnPath,
  googleReviewsMobileBridgePath,
} from '@/features/reviews/google-connect/server/googleConnectReturnPath';
import { verifyGoogleConnectState } from '@/features/reviews/google-connect/server/googleConnectState';
import { pullGoogleBusinessReviews } from '@/features/reviews/google-connect/server/pullGoogleBusinessReviews';
import { upsertGoogleBusinessConnection } from '@/features/reviews/google-connect/server/upsertGoogleBusinessConnection';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

function finishConnect(
  request: NextRequest,
  notice: 'connected' | 'error',
  client: 'web' | 'mobile'
): NextResponse {
  const path =
    client === 'mobile'
      ? googleReviewsMobileBridgePath(notice)
      : googleConnectReturnPath(notice);
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set({
    name: GOOGLE_CONNECT_STATE_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}

function clientFromState(state: string, secret: string): 'web' | 'mobile' {
  const verified = verifyGoogleConnectState({
    state,
    nonce: '',
    secret,
  });
  return verified.ok ? verified.value.client : 'web';
}

async function mobileOwnerCanConnect(userId: string): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return false;
    return isGoogleReviewsRolloutEmail(data.user?.email);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const config = getGoogleBusinessOAuthConfig();
    if (!config) {
      return NextResponse.redirect(
        new URL(ROUTES.DASHBOARD.REVIEWS, request.url)
      );
    }

    const state = request.nextUrl.searchParams.get('state')?.trim() ?? '';
    const returnClient = clientFromState(state, config.clientSecret);

    const denied = request.nextUrl.searchParams.get('error');
    if (denied) {
      return finishConnect(request, 'error', returnClient);
    }

    const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
    const nonce = request.cookies.get(GOOGLE_CONNECT_STATE_COOKIE)?.value ?? '';

    const verified = verifyGoogleConnectState({
      state,
      nonce,
      secret: config.clientSecret,
    });
    if (!verified.ok || !code) {
      return finishConnect(request, 'error', returnClient);
    }

    if (verified.value.client === 'mobile') {
      const allowed = await mobileOwnerCanConnect(verified.value.userId);
      if (!allowed) {
        return finishConnect(request, 'error', 'mobile');
      }
    } else {
      const auth = await getAuthenticatedUser(request);
      if (
        'error' in auth ||
        auth.user.id !== verified.value.userId ||
        !isGoogleReviewsRolloutEmail(auth.user.email)
      ) {
        return finishConnect(request, 'error', 'web');
      }
    }

    const exchanged = await exchangeGoogleBusinessCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: getGoogleBusinessRedirectUri(request),
    });
    if (!exchanged.ok) {
      return finishConnect(request, 'error', verified.value.client);
    }

    const fetched = await fetchGoogleBusinessLocationPick(
      exchanged.tokens.accessToken
    );
    const location = fetched.ok
      ? fetched.location
      : {
          googleAccountName: null,
          googleLocationName: null,
          googleLocationTitle: null,
        };
    const saved = await upsertGoogleBusinessConnection({
      businessId: verified.value.businessId,
      tokens: exchanged.tokens,
      location,
    });
    if (!saved.ok) {
      return finishConnect(request, 'error', verified.value.client);
    }

    const pulled = await pullGoogleBusinessReviews(verified.value.businessId);
    if (!pulled.ok) {
      console.warn('[reviews:google-connect] initial pull failed', {
        status: pulled.status,
      });
    }

    return finishConnect(request, 'connected', verified.value.client);
  } catch (error) {
    console.error('[reviews:google-connect] callback failed', error);
    return finishConnect(request, 'error', 'web');
  }
}
