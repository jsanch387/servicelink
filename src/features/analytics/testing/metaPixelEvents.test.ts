import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendMetaCapiEvent } from '../server/sendMetaCapiEvent';
import { trackMetaCompleteRegistrationOnce } from '../utils/metaCompleteRegistration';
import {
  completeRegistrationEventId,
  subscribeEventId,
} from '../utils/metaPixel';
import { trackMetaSubscribeOnce } from '../utils/metaSubscribeTracking';

describe('meta pixel event ids', () => {
  it('uses stable per-user ids for CAPI + browser dedupe', () => {
    expect(completeRegistrationEventId('user-1')).toBe('sl_cr_user-1');
    expect(subscribeEventId('user-1')).toBe('sl_sub_user-1');
  });
});

describe('sendMetaCapiEvent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('no-ops when CAPI is not configured', async () => {
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendMetaCapiEvent({
      eventName: 'CompleteRegistration',
      eventId: 'sl_cr_user-1',
      userId: 'user-1',
    });

    expect(result.sent).toBe(false);
    expect(result.skippedReason).toBe('no_access_token');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts CompleteRegistration with the same event_id when token is set', async () => {
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '1456318202654985');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '{}',
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendMetaCapiEvent({
      eventName: 'CompleteRegistration',
      eventId: 'sl_cr_user-1',
      email: 'Jane@Example.com',
      userId: 'user-1',
      fbclid: 'abc123',
    });

    expect(result.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(options.body)) as {
      data: Array<{ event_name: string; event_id: string }>;
    };
    expect(body.data[0]?.event_name).toBe('CompleteRegistration');
    expect(body.data[0]?.event_id).toBe('sl_cr_user-1');
  });
});

describe('browser CompleteRegistration', () => {
  afterEach(() => {
    localStorage.clear();
    delete window.fbq;
  });

  it('fires once per user with eventID and does not fire again', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaCompleteRegistrationOnce('user-1', 'sl_cr_user-1');
    trackMetaCompleteRegistrationOnce('user-1', 'sl_cr_user-1');

    expect(fbq).toHaveBeenCalledOnce();
    expect(fbq).toHaveBeenCalledWith(
      'track',
      'CompleteRegistration',
      { content_name: 'signup' },
      { eventID: 'sl_cr_user-1' }
    );
  });
});

describe('browser Subscribe', () => {
  afterEach(() => {
    localStorage.clear();
    delete window.fbq;
  });

  it('fires Subscribe with a distinct eventID', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaSubscribeOnce('user-1');

    expect(fbq).toHaveBeenCalledWith(
      'track',
      'Subscribe',
      { content_name: 'pro' },
      { eventID: 'sl_sub_user-1' }
    );
  });
});
