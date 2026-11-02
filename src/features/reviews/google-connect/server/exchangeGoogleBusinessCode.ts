import {
  GOOGLE_BUSINESS_MANAGE_SCOPE,
  GOOGLE_OAUTH_TOKEN_URL,
} from './googleBusinessOAuth';

export type GoogleBusinessTokenResult = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
  scopes: string;
};

export async function exchangeGoogleBusinessCode(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<
  { ok: true; tokens: GoogleBusinessTokenResult } | { ok: false; error: string }
> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
  });

  let response: Response;
  try {
    response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    return { ok: false, error: 'Could not reach Google. Try again.' };
  }

  const json = (await response.json().catch(() => null)) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    scope?: unknown;
    error?: unknown;
    error_description?: unknown;
  } | null;

  if (!response.ok || !json || typeof json.access_token !== 'string') {
    const description =
      typeof json?.error_description === 'string'
        ? json.error_description
        : 'Google did not return tokens.';
    console.error('[reviews:google-connect] token exchange failed', {
      status: response.status,
      error: json?.error,
    });
    return { ok: false, error: description };
  }

  if (typeof json.refresh_token !== 'string' || !json.refresh_token.trim()) {
    return {
      ok: false,
      error:
        'Google did not return a refresh token. Disconnect ServiceLink in your Google account and try again.',
    };
  }

  const expiresIn =
    typeof json.expires_in === 'number' && json.expires_in > 0
      ? json.expires_in
      : null;

  return {
    ok: true,
    tokens: {
      accessToken: json.access_token,
      refreshToken: json.refresh_token.trim(),
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
      scopes:
        typeof json.scope === 'string' && json.scope.trim()
          ? json.scope.trim()
          : GOOGLE_BUSINESS_MANAGE_SCOPE,
    },
  };
}
