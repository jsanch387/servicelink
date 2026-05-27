import type { NextRequest } from 'next/server';

import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';

export const META_GRAPH_API_VERSION = 'v21.0';

export const META_OAUTH_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_manage_metadata',
  'instagram_manage_messages',
] as const;

export function getMetaAppId(): string {
  const id = process.env.META_APP_ID?.trim();
  if (!id) {
    throw new Error('META_APP_ID is not set');
  }
  return id;
}

export function getMetaAppSecret(): string {
  const secret = process.env.META_APP_SECRET?.trim();
  if (!secret) {
    throw new Error('META_APP_SECRET is not set');
  }
  return secret;
}

export function getMetaOAuthStateSecret(): string {
  return (
    process.env.META_OAUTH_STATE_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim() ||
    ''
  );
}

export function getMetaInstagramOAuthRedirectUri(request: NextRequest): string {
  return `${getAppBaseUrl(request)}/api/meta/instagram/callback`;
}

export function buildMetaOAuthAuthorizeUrl(params: {
  request: NextRequest;
  state: string;
}): string {
  const appId = getMetaAppId();
  const redirectUri = getMetaInstagramOAuthRedirectUri(params.request);
  const scope = META_OAUTH_SCOPES.join(',');
  const url = new URL(
    `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`
  );
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('scope', scope);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}
