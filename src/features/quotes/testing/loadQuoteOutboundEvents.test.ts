import { loadQuoteOutboundEvents } from '@/features/quotes/dashboard/server/loadQuoteOutboundEvents';
import { describe, expect, it, vi } from 'vitest';

describe('loadQuoteOutboundEvents', () => {
  it('maps sent email and SMS rows in time order', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          quote_id: 'q1',
          channel: 'email',
          type: 'quote_reminder',
          status: 'sent',
          sent_at: '2026-09-03T14:00:00.000Z',
          to_address: 'jane@example.com',
        },
        {
          quote_id: 'q1',
          channel: 'sms',
          type: 'quote_reminder',
          status: 'sent',
          sent_at: '2026-09-03T14:00:01.000Z',
          to_address: '5551234567',
        },
      ],
      error: null,
    });
    const inFilter = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });

    const events = await loadQuoteOutboundEvents({ from } as never, 'q1');

    expect(from).toHaveBeenCalledWith('quote_outbound_events');
    expect(inFilter).toHaveBeenCalledWith('quote_id', ['q1']);
    expect(events).toEqual([
      {
        channel: 'email',
        type: 'quote_reminder',
        status: 'sent',
        sentAt: '2026-09-03T14:00:00.000Z',
        toAddress: 'jane@example.com',
      },
      {
        channel: 'sms',
        type: 'quote_reminder',
        status: 'sent',
        sentAt: '2026-09-03T14:00:01.000Z',
        toAddress: '5551234567',
      },
    ]);
  });

  it('returns [] when the query fails', async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });
    const inFilter = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      loadQuoteOutboundEvents({ from } as never, 'q1')
    ).resolves.toEqual([]);
  });
});
