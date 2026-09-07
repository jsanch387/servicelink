import { createHash } from 'crypto';
import { META_PIXEL_ID } from '../utils/metaPixel';

export type MetaCapiEventName = 'CompleteRegistration' | 'Subscribe';

export type SendMetaCapiEventInput = {
  eventName: MetaCapiEventName;
  eventId: string;
  eventSourceUrl?: string;
  email?: string | null;
  userId?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
};

export type SendMetaCapiEventResult = {
  sent: boolean;
  skippedReason?: string;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildFbc(fbclid?: string | null): string | undefined {
  const clickId = fbclid?.trim();
  if (!clickId) return undefined;
  if (clickId.startsWith('fb.')) return clickId;
  return `fb.1.${Math.floor(Date.now() / 1000)}.${clickId}`;
}

function capiAccessToken(): string | null {
  const token =
    process.env.META_CAPI_ACCESS_TOKEN?.trim() ||
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
  return token || null;
}

function pixelId(): string {
  return (
    process.env.META_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ||
    META_PIXEL_ID
  );
}

/**
 * Meta Conversion API. No-ops when META_CAPI_ACCESS_TOKEN is unset.
 * Use the same eventId as the browser pixel for dedupe.
 */
export async function sendMetaCapiEvent(
  input: SendMetaCapiEventInput
): Promise<SendMetaCapiEventResult> {
  const token = capiAccessToken();
  if (!token) {
    return { sent: false, skippedReason: 'no_access_token' };
  }

  const eventId = input.eventId.trim();
  if (!eventId) {
    return { sent: false, skippedReason: 'no_event_id' };
  }

  const userData: Record<string, unknown> = {};
  const email = input.email ? normalizeEmail(input.email) : '';
  if (email) userData.em = [sha256(email)];
  if (input.userId?.trim())
    userData.external_id = [sha256(input.userId.trim())];
  if (input.clientIp?.trim())
    userData.client_ip_address = input.clientIp.trim();
  if (input.userAgent?.trim())
    userData.client_user_agent = input.userAgent.trim();
  if (input.fbp?.trim()) userData.fbp = input.fbp.trim();

  const fbc = input.fbc?.trim() || buildFbc(input.fbclid);
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url:
          input.eventSourceUrl?.trim() || 'https://myservicelink.app/',
        user_data: userData,
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE?.trim()
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE.trim() }
      : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId()}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        '[MetaCAPI] event failed',
        input.eventName,
        response.status,
        body.slice(0, 300)
      );
      return { sent: false, skippedReason: 'http_error' };
    }

    return { sent: true };
  } catch (error) {
    console.error('[MetaCAPI] event error', input.eventName, error);
    return { sent: false, skippedReason: 'network_error' };
  }
}

export function metaClickCookiesFromRequest(headers: Headers): {
  fbp?: string;
  fbc?: string;
} {
  const cookie = headers.get('cookie') ?? '';
  const fbp = cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
  const fbc = cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  return {
    ...(fbp ? { fbp: decodeURIComponent(fbp) } : {}),
    ...(fbc ? { fbc: decodeURIComponent(fbc) } : {}),
  };
}

export function clientIpFromRequest(headers: Headers): string | undefined {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip')?.trim() || undefined;
}
