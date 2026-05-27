import {
  META_GRAPH_API_VERSION,
  getMetaAppId,
  getMetaAppSecret,
} from '@/services/meta/metaOAuthConfig';

export type MetaPageWithInstagram = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramAccountId: string;
  instagramUsername: string | null;
};

type GraphErrorBody = {
  error?: { message?: string; code?: number };
};

async function graphGet<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json().catch(() => null)) as T & GraphErrorBody;
  if (!response.ok) {
    const message =
      typeof body?.error?.message === 'string'
        ? body.error.message
        : `Graph API request failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}

export async function exchangeMetaOAuthCodeForUserToken(params: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token`
  );
  url.searchParams.set('client_id', getMetaAppId());
  url.searchParams.set('client_secret', getMetaAppSecret());
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('code', params.code);

  const body = await graphGet<{ access_token?: string }>(url.toString());
  const token = body.access_token?.trim();
  if (!token) {
    throw new Error('Meta did not return an access token');
  }
  return token;
}

export async function exchangeForLongLivedUserToken(
  shortLivedToken: string
): Promise<string> {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token`
  );
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', getMetaAppId());
  url.searchParams.set('client_secret', getMetaAppSecret());
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const body = await graphGet<{ access_token?: string }>(url.toString());
  const token = body.access_token?.trim();
  if (!token) {
    throw new Error('Meta did not return a long-lived user token');
  }
  return token;
}

export async function listPagesWithInstagram(
  userAccessToken: string
): Promise<MetaPageWithInstagram[]> {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/accounts`
  );
  url.searchParams.set(
    'fields',
    'id,name,access_token,instagram_business_account{id,username}'
  );
  url.searchParams.set('access_token', userAccessToken);

  const body = await graphGet<{
    data?: Array<{
      id?: string;
      name?: string;
      access_token?: string;
      instagram_business_account?: { id?: string; username?: string };
    }>;
  }>(url.toString());

  const pages = body.data ?? [];
  const matches: MetaPageWithInstagram[] = [];

  for (const page of pages) {
    const ig = page.instagram_business_account;
    const pageId = page.id?.trim();
    const pageToken = page.access_token?.trim();
    const igId = ig?.id?.trim();
    if (!pageId || !pageToken || !igId) continue;

    matches.push({
      pageId,
      pageName: page.name?.trim() || 'Facebook Page',
      pageAccessToken: pageToken,
      instagramAccountId: igId,
      instagramUsername: ig?.username?.trim() || null,
    });
  }

  return matches;
}

export async function completeInstagramChannelConnect(params: {
  code: string;
  redirectUri: string;
}): Promise<MetaPageWithInstagram> {
  const shortLived = await exchangeMetaOAuthCodeForUserToken(params);
  const longLivedUser = await exchangeForLongLivedUserToken(shortLived);
  const pages = await listPagesWithInstagram(longLivedUser);

  if (pages.length === 0) {
    throw new Error(
      'No Facebook Page with a linked Instagram professional account was found. Link Instagram to your Page in Meta Business settings, then try again.'
    );
  }

  if (pages.length > 1) {
    console.warn(
      '[meta:instagram-connect] Multiple Pages with Instagram found; using first match',
      pages.map(p => ({ pageId: p.pageId, ig: p.instagramAccountId }))
    );
  }

  return pages[0];
}
