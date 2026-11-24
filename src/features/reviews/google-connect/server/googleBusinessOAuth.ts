import { API_ROUTES } from '@/constants/routes';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';

export const GOOGLE_BUSINESS_MANAGE_SCOPE =
  'https://www.googleapis.com/auth/business.manage';

export const GOOGLE_OAUTH_AUTHORIZE_URL =
  'https://accounts.google.com/o/oauth2/v2/auth';

export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const GOOGLE_CONNECT_STATE_COOKIE = 'sl_gbp_oauth';

export type GoogleBusinessOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export function getGoogleBusinessOAuthConfig(): GoogleBusinessOAuthConfig | null {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() ?? '';
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getGoogleBusinessRedirectUri(request?: Request | null): string {
  return `${getAppBaseUrl(request)}${API_ROUTES.REVIEWS_GOOGLE_CALLBACK}`;
}

export function buildGoogleBusinessAuthorizeUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
    response_type: 'code',
    scope: GOOGLE_BUSINESS_MANAGE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state: args.state,
  });
  return `${GOOGLE_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}
