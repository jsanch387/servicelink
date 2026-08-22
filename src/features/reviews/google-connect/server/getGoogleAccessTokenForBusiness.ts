import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { getGoogleBusinessOAuthConfig } from './googleBusinessOAuth';
import { refreshGoogleAccessToken } from './refreshGoogleAccessToken';

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

export type GoogleAccessTokenContext = {
  connectionId: string;
  accessToken: string;
  googleAccountName: string | null;
  googleLocationName: string | null;
  googleLocationTitle: string | null;
};

export async function getGoogleAccessTokenForBusiness(
  businessId: string
): Promise<
  | { ok: true; context: GoogleAccessTokenContext }
  | { ok: false; status: number; error: string }
> {
  const config = getGoogleBusinessOAuthConfig();
  if (!config) {
    return {
      ok: false,
      status: 500,
      error: 'Google Business is not configured.',
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: connection, error } = await admin
    .from('google_business_connections')
    .select(
      'id, refresh_token, access_token, access_token_expires_at, google_account_name, google_location_name, google_location_title'
    )
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.error('[reviews:google-connect] token load failed', error);
    return {
      ok: false,
      status: 500,
      error: 'Could not load the Google connection.',
    };
  }
  if (!connection) {
    return { ok: false, status: 404, error: 'Connect Google first.' };
  }

  const expiresAtMs = connection.access_token_expires_at
    ? new Date(connection.access_token_expires_at).getTime()
    : 0;
  const accessTokenStillGood =
    Boolean(connection.access_token) &&
    expiresAtMs - ACCESS_TOKEN_REFRESH_BUFFER_MS > Date.now();

  if (accessTokenStillGood && connection.access_token) {
    return {
      ok: true,
      context: {
        connectionId: connection.id,
        accessToken: connection.access_token,
        googleAccountName: connection.google_account_name,
        googleLocationName: connection.google_location_name,
        googleLocationTitle: connection.google_location_title,
      },
    };
  }

  const refreshed = await refreshGoogleAccessToken({
    refreshToken: connection.refresh_token,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  if (!refreshed.ok) {
    return { ok: false, status: 401, error: refreshed.error };
  }

  const { error: tokenUpdateError } = await admin
    .from('google_business_connections')
    .update({
      access_token: refreshed.accessToken,
      access_token_expires_at: refreshed.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id);
  if (tokenUpdateError) {
    console.error(
      '[reviews:google-connect] token persist failed',
      tokenUpdateError
    );
  }

  return {
    ok: true,
    context: {
      connectionId: connection.id,
      accessToken: refreshed.accessToken,
      googleAccountName: connection.google_account_name,
      googleLocationName: connection.google_location_name,
      googleLocationTitle: connection.google_location_title,
    },
  };
}
