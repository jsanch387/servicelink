/**
 * GET /api/meta/instagram/callback
 *
 * Facebook OAuth callback — stores Page + Instagram ids and Page access token.
 */

import { ROUTES } from '@/constants/routes';
import { instagramMessagingChannelsOf } from '@/features/automation/server/instagramMessagingChannelsQuery';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { completeInstagramChannelConnect } from '@/services/meta/completeInstagramChannelConnect';
import { getMetaInstagramOAuthRedirectUri } from '@/services/meta/metaOAuthConfig';
import { parseMetaOAuthState } from '@/services/meta/metaOAuthState';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[meta:instagram-callback]';

function redirectToAutomation(
  request: NextRequest,
  query: Record<string, string>
): NextResponse {
  const url = new URL(ROUTES.DASHBOARD.AUTOMATION, getAppBaseUrl(request));
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (error) {
    console.warn(`${LOG} oauth error`, { error, errorDescription });
    return redirectToAutomation(request, {
      connect: 'error',
      message: errorDescription?.trim() || error,
    });
  }

  if (!code?.trim() || !state?.trim()) {
    return redirectToAutomation(request, {
      connect: 'error',
      message: 'Missing authorization code from Facebook',
    });
  }

  const parsedState = parseMetaOAuthState(state);
  if (!parsedState) {
    return redirectToAutomation(request, {
      connect: 'error',
      message: 'Connect session expired. Try again.',
    });
  }

  try {
    const redirectUri = getMetaInstagramOAuthRedirectUri(request);
    const page = await completeInstagramChannelConnect({
      code: code.trim(),
      redirectUri,
    });

    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error: upsertError } = await instagramMessagingChannelsOf(
      admin
    ).upsert(
      {
        business_id: parsedState.businessId,
        instagram_account_id: page.instagramAccountId,
        facebook_page_id: page.pageId,
        facebook_page_name: page.pageName,
        instagram_username: page.instagramUsername,
        page_access_token: page.pageAccessToken,
        connected_by_user_id: parsedState.userId,
        connected_at: now,
        disconnected_at: null,
        updated_at: now,
      },
      { onConflict: 'business_id' }
    );

    if (upsertError) {
      console.error(`${LOG} upsert failed`, upsertError);
      return redirectToAutomation(request, {
        connect: 'error',
        message:
          'Connected to Facebook but could not save settings. Run the instagram_messaging_channels migration in Supabase.',
      });
    }

    console.log(`${LOG} connected`, {
      businessId: parsedState.businessId,
      instagramAccountId: page.instagramAccountId,
      pageId: page.pageId,
    });

    return redirectToAutomation(request, { connect: 'return' });
  } catch (connectError) {
    console.error(`${LOG} connect failed`, connectError);
    const message =
      connectError instanceof Error
        ? connectError.message
        : 'Instagram connect failed';
    return redirectToAutomation(request, {
      connect: 'error',
      message,
    });
  }
}
