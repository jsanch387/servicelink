import { notifyOwnerForQuoteRequestFollowUp } from '@/features/quotes/server/reminders/notifyOwnerForQuoteRequestFollowUp';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

function notificationsFrom(opts: {
  recentNewRequest?: boolean;
  insertError?: { code: string } | null;
}) {
  const insert = vi.fn().mockResolvedValue({
    error: opts.insertError ?? null,
  });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.recentNewRequest ? { id: 'existing-new' } : null,
    error: null,
  });
  const chain: {
    eq: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  };
  chain.eq.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  const select = vi.fn().mockReturnValue(chain);
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'notifications') return { select, insert };
    return { select: vi.fn(), insert: vi.fn() };
  });
  return { from, insert, select };
}

describe('notifyOwnerForQuoteRequestFollowUp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips when required fields are missing', async () => {
    const from = vi.fn();
    const result = await notifyOwnerForQuoteRequestFollowUp({ from } as never, {
      profileId: '',
      count: 1,
      localDateYmd: '2026-08-31',
    });
    expect(result).toBe('skipped');
    expect(from).not.toHaveBeenCalled();
  });

  it('skips the waiting push if they already got a new-request ping today', async () => {
    const { from, insert } = notificationsFrom({ recentNewRequest: true });

    const result = await notifyOwnerForQuoteRequestFollowUp({ from } as never, {
      profileId: 'owner-1',
      count: 2,
      localDateYmd: '2026-08-31',
      now: new Date('2026-08-31T18:00:00.000Z'),
    });

    expect(result).toBe('skipped');
    expect(insert).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });

  it('inserts inbox + push on the first send', async () => {
    const { from, insert } = notificationsFrom({});

    const result = await notifyOwnerForQuoteRequestFollowUp({ from } as never, {
      profileId: 'owner-1',
      count: 2,
      localDateYmd: '2026-08-31',
      now: new Date('2026-08-31T18:00:00.000Z'),
    });

    expect(result).toBe('sent');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'owner-1',
        type: 'quote_request_followup',
        reference_type: 'screen',
        reference_id: '00000000-0000-4000-a000-000000000071',
        title: 'Quote request waiting',
        body: '2 quotes are waiting on you.',
        dedupe_key: 'quote_request_followup:owner-1:2026-08-31',
        metadata: { reference_type: 'screen', reference_id: 'quotes' },
      })
    );
    expect(sendExpoPushToUser).toHaveBeenCalledWith(
      expect.objectContaining({ from }),
      expect.objectContaining({
        userId: 'owner-1',
        title: 'Quote request waiting',
        body: '2 quotes are waiting on you.',
        data: {
          reference_type: 'screen',
          reference_id: 'quotes',
        },
      })
    );
  });

  it('does not push again when the inbox row already exists', async () => {
    const { from } = notificationsFrom({
      insertError: { code: '23505' },
    });

    const result = await notifyOwnerForQuoteRequestFollowUp({ from } as never, {
      profileId: 'owner-1',
      count: 1,
      localDateYmd: '2026-08-31',
      now: new Date('2026-08-31T18:00:00.000Z'),
    });

    expect(result).toBe('duplicate');
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });
});
