import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('sendExpoPushToUser', () => {
  const originalToken = process.env.EXPO_ACCESS_TOKEN;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.EXPO_ACCESS_TOKEN = 'test-expo-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.EXPO_ACCESS_TOKEN = originalToken;
  });

  it('no-ops when EXPO_ACCESS_TOKEN is unset', async () => {
    delete process.env.EXPO_ACCESS_TOKEN;

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    await sendExpoPushToUser({ from } as never, {
      userId: 'user-1',
      title: 'T',
      body: 'B',
      data: { reference_type: 'booking', reference_id: 'bid-1' },
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts Expo messages for each token', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    } as Response);

    const eq = vi.fn().mockResolvedValue({
      data: [{ expo_push_token: 'ExponentPushToken[aaa]' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await sendExpoPushToUser({ from } as never, {
      userId: 'user-1',
      title: 'New appointment',
      body: 'Details',
      data: { reference_type: 'booking', reference_id: 'bid-1' },
    });

    expect(from).toHaveBeenCalledWith('user_push_tokens');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual([
      {
        to: 'ExponentPushToken[aaa]',
        title: 'New appointment',
        body: 'Details',
        data: {
          reference_type: 'booking',
          reference_id: 'bid-1',
          referenceType: 'booking',
          referenceId: 'bid-1',
        },
      },
    ]);
  });

  it('omits body when null or whitespace', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    } as Response);

    const eq = vi.fn().mockResolvedValue({
      data: [{ expo_push_token: 'ExponentPushToken[bbb]' }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await sendExpoPushToUser({ from } as never, {
      userId: 'user-1',
      title: 'New appointment',
      body: null,
      data: { reference_type: 'booking', reference_id: 'bid-1' },
    });

    const [, init] = fetchMock.mock.calls[0];
    const parsed = JSON.parse(String(init?.body));
    expect(parsed[0]).toEqual({
      to: 'ExponentPushToken[bbb]',
      title: 'New appointment',
      data: {
        reference_type: 'booking',
        reference_id: 'bid-1',
        referenceType: 'booking',
        referenceId: 'bid-1',
      },
    });
    expect(parsed[0].body).toBeUndefined();
  });
});

describe('sendExpoPushBroadcast', () => {
  const originalToken = process.env.EXPO_ACCESS_TOKEN;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.EXPO_ACCESS_TOKEN = 'test-expo-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.EXPO_ACCESS_TOKEN = originalToken;
  });

  it('sends to all tokens from user_push_tokens', async () => {
    const { sendExpoPushBroadcast } = await import(
      '@/features/push/server/sendExpoPushToUser'
    );

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: 'ok' }] }),
    } as Response);

    const range = vi.fn().mockResolvedValue({
      data: [
        { expo_push_token: 'ExponentPushToken[one]' },
        { expo_push_token: 'ExponentPushToken[two]' },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ range });
    const from = vi.fn().mockReturnValue({ select });

    const result = await sendExpoPushBroadcast({ from } as never, {
      title: 'New feature',
      body: 'Try it now',
      data: { reference_type: 'announcement', reference_id: 'launch-1' },
    });

    expect(from).toHaveBeenCalledWith('user_push_tokens');
    expect(range).toHaveBeenCalledWith(0, 999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tokenCount: 2, messageCount: 2 });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toHaveLength(2);
    expect(body[0].to).toBe('ExponentPushToken[one]');
    expect(body[1].to).toBe('ExponentPushToken[two]');
  });
});
