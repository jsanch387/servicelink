import { createHmac, timingSafeEqual } from 'crypto';

import { getMetaOAuthStateSecret } from '@/services/meta/metaOAuthConfig';

const STATE_TTL_MS = 15 * 60 * 1000;

type OAuthStatePayload = {
  businessId: string;
  userId: string;
  ts: number;
};

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function createMetaOAuthState(payload: {
  businessId: string;
  userId: string;
}): string {
  const secret = getMetaOAuthStateSecret();
  if (!secret) {
    throw new Error('META_OAUTH_STATE_SECRET or META_APP_SECRET is not set');
  }

  const data: OAuthStatePayload = {
    businessId: payload.businessId,
    userId: payload.userId,
    ts: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = signBody(body, secret);
  return `${body}.${signature}`;
}

export function parseMetaOAuthState(
  state: string
): { businessId: string; userId: string } | null {
  const secret = getMetaOAuthStateSecret();
  if (!secret) return null;

  const trimmed = state.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = trimmed.slice(0, dot);
  const signature = trimmed.slice(dot + 1);
  const expected = signBody(body, secret);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as OAuthStatePayload;
    if (
      typeof parsed.businessId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.ts !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > STATE_TTL_MS) {
      return null;
    }
    return { businessId: parsed.businessId, userId: parsed.userId };
  } catch {
    return null;
  }
}
