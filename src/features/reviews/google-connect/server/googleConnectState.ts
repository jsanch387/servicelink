import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const GOOGLE_CONNECT_STATE_TTL_MS = 10 * 60 * 1000;

type GoogleConnectStatePayload = {
  businessId: string;
  userId: string;
  nonce: string;
  exp: number;
};

export type VerifiedGoogleConnectState = {
  businessId: string;
  userId: string;
};

export function createGoogleConnectState(args: {
  businessId: string;
  userId: string;
  secret: string;
  now?: number;
}): { state: string; nonce: string } {
  const nonce = randomBytes(16).toString('hex');
  const payload: GoogleConnectStatePayload = {
    businessId: args.businessId.trim(),
    userId: args.userId.trim(),
    nonce,
    exp: (args.now ?? Date.now()) + GOOGLE_CONNECT_STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const sig = createHmac('sha256', args.secret).update(body).digest('base64url');
  return { state: `${body}.${sig}`, nonce };
}

export function verifyGoogleConnectState(args: {
  state: string;
  nonce: string;
  secret: string;
  now?: number;
}): { ok: true; value: VerifiedGoogleConnectState } | { ok: false } {
  const trimmedState = args.state.trim();
  const trimmedNonce = args.nonce.trim();
  if (!trimmedState || !trimmedNonce || !args.secret) {
    return { ok: false };
  }

  const dot = trimmedState.lastIndexOf('.');
  if (dot <= 0 || dot === trimmedState.length - 1) {
    return { ok: false };
  }

  const body = trimmedState.slice(0, dot);
  const sig = trimmedState.slice(dot + 1);
  const expected = createHmac('sha256', args.secret)
    .update(body)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { ok: false };
  }

  let payload: GoogleConnectStatePayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as GoogleConnectStatePayload;
  } catch {
    return { ok: false };
  }

  if (
    typeof payload.businessId !== 'string' ||
    !payload.businessId.trim() ||
    typeof payload.userId !== 'string' ||
    !payload.userId.trim() ||
    typeof payload.nonce !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false };
  }

  const nonceBuf = Buffer.from(payload.nonce);
  const cookieBuf = Buffer.from(trimmedNonce);
  if (
    nonceBuf.length !== cookieBuf.length ||
    !timingSafeEqual(nonceBuf, cookieBuf)
  ) {
    return { ok: false };
  }

  if ((args.now ?? Date.now()) > payload.exp) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      businessId: payload.businessId.trim(),
      userId: payload.userId.trim(),
    },
  };
}
