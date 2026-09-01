import { describe, expect, it } from 'vitest';
import {
  groupStaleRequestsByOwner,
  type StaleQuoteRequestRow,
} from '@/features/quotes/server/reminders/loadStaleCustomerQuoteRequests';
import {
  quoteRequestFollowUpBody,
  quoteRequestFollowUpDedupeKey,
  quoteRequestFollowUpTitle,
} from '@/features/quotes/server/reminders/quoteRequestFollowUpCopy';
import {
  quoteRequestFollowUpBounds,
  quoteRequestFollowUpLocalDate,
} from '@/features/quotes/server/reminders/quoteRequestFollowUpDate';

describe('quote request follow-up copy', () => {
  it('uses a waiting title, not New quote request', () => {
    expect(quoteRequestFollowUpTitle()).toBe('Quote request waiting');
  });

  it('uses a simple waiting count', () => {
    expect(quoteRequestFollowUpBody(1)).toBe('1 quote is waiting on you.');
    expect(quoteRequestFollowUpBody(3)).toBe('3 quotes are waiting on you.');
  });

  it('dedupes once per owner per local day', () => {
    expect(quoteRequestFollowUpDedupeKey('owner-1', '2026-08-31')).toBe(
      'quote_request_followup:owner-1:2026-08-31'
    );
  });
});

describe('quote request follow-up date', () => {
  it('nudges for 3 days after the first 24h, then stops', () => {
    const now = new Date('2026-08-31T18:00:00.000Z');
    expect(quoteRequestFollowUpBounds(now)).toEqual({
      staleBeforeIso: '2026-08-30T18:00:00.000Z',
      staleOnOrAfterIso: '2026-08-27T18:00:00.000Z',
    });
  });

  it('formats a Chicago calendar date', () => {
    expect(
      quoteRequestFollowUpLocalDate(
        new Date('2026-09-01T02:00:00.000Z'),
        'America/Chicago'
      )
    ).toBe('2026-08-31');
  });
});

describe('groupStaleRequestsByOwner', () => {
  it('counts per owner', () => {
    const rows: StaleQuoteRequestRow[] = [
      {
        id: 'newer',
        business_id: 'biz-a',
        requestedAt: '2026-08-30T12:00:00.000Z',
      },
      {
        id: 'older',
        business_id: 'biz-a',
        requestedAt: '2026-08-28T12:00:00.000Z',
      },
    ];
    expect(
      groupStaleRequestsByOwner(rows, new Map([['biz-a', 'owner-1']]))
    ).toEqual([{ profileId: 'owner-1', count: 2 }]);
  });
});
