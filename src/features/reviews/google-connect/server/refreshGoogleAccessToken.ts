import { GOOGLE_OAUTH_TOKEN_URL } from './googleBusinessOAuth';

export async function refreshGoogleAccessToken(args: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<
  | { ok: true; accessToken: string; expiresAt: string | null }
  | { ok: false; error: string }
> {
  const body = new URLSearchParams({
    refresh_token: args.refreshToken,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    grant_type: 'refresh_token',
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
    expires_in?: unknown;
    error?: unknown;
  } | null;

  if (!response.ok || typeof json?.access_token !== 'string') {
    console.error('[reviews:google-connect] token refresh failed', {
      status: response.status,
      error: json?.error,
    });
    return { ok: false, error: 'Google sign-in expired. Connect Google again.' };
  }

  const expiresIn =
    typeof json.expires_in === 'number' && json.expires_in > 0
      ? json.expires_in
      : null;

  return {
    ok: true,
    accessToken: json.access_token,
    expiresAt: expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null,
  };
}
