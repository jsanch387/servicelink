import { buildQuoteActivityTimeline } from '@/features/quotes/dashboard/utils/buildQuoteActivityTimeline';
import type { QuoteCommunication } from '@/features/quotes/shared/quoteOutboundEvents';
import { describe, expect, it } from 'vitest';

const emailSent: QuoteCommunication = {
  channel: 'email',
  type: 'quote_reminder',
  status: 'sent',
  sentAt: '2026-09-04T14:00:00.000Z',
  toAddress: 'jane@example.com',
};

const textSent: QuoteCommunication = {
  channel: 'sms',
  type: 'quote_reminder',
  status: 'sent',
  sentAt: '2026-09-04T14:00:05.000Z',
  toAddress: '5551234567',
};

describe('buildQuoteActivityTimeline', () => {
  it('orders created, viewed, then sends', () => {
    const items = buildQuoteActivityTimeline({
      createdAt: '2026-09-01T12:00:00.000Z',
      viewedAt: '2026-09-02T15:00:00.000Z',
      communications: [textSent, emailSent],
    });

    expect(items.map(item => item.label)).toEqual([
      'Created',
      'Viewed',
      'Email sent',
      'Text sent',
    ]);
  });

  it('omits viewed until the customer opens the quote', () => {
    const items = buildQuoteActivityTimeline({
      createdAt: '2026-09-01T12:00:00.000Z',
      viewedAt: null,
      communications: [emailSent],
    });

    expect(items.map(item => item.label)).toEqual(['Created', 'Email sent']);
  });

  it('labels failed sends', () => {
    const items = buildQuoteActivityTimeline({
      createdAt: '2026-09-01T12:00:00.000Z',
      viewedAt: null,
      communications: [{ ...emailSent, status: 'failed' }],
    });

    expect(items.map(item => item.label)).toEqual(['Created', 'Email failed']);
  });
});
