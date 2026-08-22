import {
  buildGoogleBusinessAuthorizeUrl,
  getGoogleBusinessOAuthConfig,
  getGoogleBusinessRedirectUri,
  GOOGLE_CONNECT_STATE_COOKIE,
} from './googleBusinessOAuth';
import {
  createGoogleConnectState,
  GOOGLE_CONNECT_STATE_TTL_MS,
} from './googleConnectState';

export type GoogleConnectStateCookie = {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
};

export type StartGoogleBusinessConnectResult =
  | {
      ok: true;
      url: string;
      cookie: GoogleConnectStateCookie;
    }
  | { ok: false; status: number; error: string };

export function startGoogleBusinessConnect(args: {
  request: Request;
  userId: string;
  businessId: string;
}): StartGoogleBusinessConnectResult {
  const config = getGoogleBusinessOAuthConfig();
  if (!config) {
    return {
      ok: false,
      status: 500,
      error: 'Google Business is not configured.',
    };
  }

  const { state, nonce } = createGoogleConnectState({
    businessId: args.businessId,
    userId: args.userId,
    secret: config.clientSecret,
  });

  return {
    ok: true,
    url: buildGoogleBusinessAuthorizeUrl({
      clientId: config.clientId,
      redirectUri: getGoogleBusinessRedirectUri(args.request),
      state,
    }),
    cookie: {
      name: GOOGLE_CONNECT_STATE_COOKIE,
      value: nonce,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(GOOGLE_CONNECT_STATE_TTL_MS / 1000),
    },
  };
}
