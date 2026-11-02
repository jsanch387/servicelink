import { ROUTES } from '@/constants/routes';
import { isGoogleReviewsRolloutEmail } from '@/features/reviews/google-connect/googleReviewsRolloutAllowlist';
import { exchangeGoogleBusinessCode } from '@/features/reviews/google-connect/server/exchangeGoogleBusinessCode';
import { fetchGoogleBusinessLocationPick } from '@/features/reviews/google-connect/server/fetchGoogleBusinessLocations';
import {
  getGoogleBusinessOAuthConfig,
  getGoogleBusinessRedirectUri,
  GOOGLE_CONNECT_STATE_COOKIE,
} from '@/features/reviews/google-connect/server/googleBusinessOAuth';
import { googleConnectReturnPath } from '@/features/reviews/google-connect/server/googleConnectReturnPath';
import { verifyGoogleConnectState } from '@/features/reviews/google-connect/server/googleConnectState';
import { pullGoogleBusinessReviews } from '@/features/reviews/google-connect/server/pullGoogleBusinessReviews';
import { upsertGoogleBusinessConnection } from '@/features/reviews/google-connect/server/upsertGoogleBusinessConnection';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

function reviewsRedirect(
  request: NextRequest,
  notice: 'connected' | 'error'
): NextResponse {
  const url = new URL(googleConnectReturnPath(notice), request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: GOOGLE_CONNECT_STATE_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const config = getGoogleBusinessOAuthConfig();
    if (!config) {
      return NextResponse.redirect(
        new URL(ROUTES.DASHBOARD.REVIEWS, request.url)
      );
    }

    const denied = request.nextUrl.searchParams.get('error');
    if (denied) {
      return reviewsRedirect(request, 'error');
    }

    const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
    const state = request.nextUrl.searchParams.get('state')?.trim() ?? '';
    const nonce = request.cookies.get(GOOGLE_CONNECT_STATE_COOKIE)?.value ?? '';

    const verified = verifyGoogleConnectState({
      state,
      nonce,
      secret: config.clientSecret,
    });
    if (!verified.ok || !code) {
      return reviewsRedirect(request, 'error');
    }

    const auth = await getAuthenticatedUser(request);
    if (
      'error' in auth ||
      auth.user.id !== verified.value.userId ||
      !isGoogleReviewsRolloutEmail(auth.user.email)
    ) {
      return reviewsRedirect(request, 'error');
    }

    const exchanged = await exchangeGoogleBusinessCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: getGoogleBusinessRedirectUri(request),
    });
    if (!exchanged.ok) {
      return reviewsRedirect(request, 'error');
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
      return reviewsRedirect(request, 'error');
    }

    const pulled = await pullGoogleBusinessReviews(verified.value.businessId);
    if (!pulled.ok) {
      console.warn('[reviews:google-connect] initial pull failed', {
        status: pulled.status,
      });
    }

    return reviewsRedirect(request, 'connected');
  } catch (error) {
    console.error('[reviews:google-connect] callback failed', error);
    return reviewsRedirect(request, 'error');
  }
}
