import {
  quoteCustomerReminderLead,
  quoteCustomerReminderSmsDedupeKey,
} from '@/features/quotes/shared/quoteCustomerReminderCopy';
import { quoteCustomerReminderBounds } from '@/features/quotes/server/reminders/quoteCustomerReminderDate';
import { buildPublicQuoteUrl } from '@/features/quotes/shared/utils/buildPublicQuoteUrl';
import { describe, expect, it } from 'vitest';

describe('quoteCustomerReminderBounds', () => {
  it('opens at 2 days and closes at 4 days so a daily cron hits once', () => {
    const now = new Date('2026-09-02T18:00:00.000Z');
    expect(quoteCustomerReminderBounds(now)).toEqual({
      sentOnOrBeforeIso: '2026-08-31T18:00:00.000Z',
      sentOnOrAfterIso: '2026-08-29T18:00:00.000Z',
    });
  });
});

describe('quoteCustomerReminderLead', () => {
  it('uses the customer first name and business', () => {
    expect(quoteCustomerReminderLead('Jane Doe', 'Acme Detail')).toBe(
      'Hey Jane, Acme Detail still has your quote open if you want to take a look.'
    );
  });

  it('works without a name or business', () => {
    expect(quoteCustomerReminderLead('', '')).toBe(
      'Your quote is still open if you want to take a look.'
    );
  });
});

describe('quoteCustomerReminderSmsDedupeKey', () => {
  it('is once per quote', () => {
    expect(quoteCustomerReminderSmsDedupeKey('q-1')).toBe('q-1:quote_reminder');
  });
});

describe('buildPublicQuoteUrl', () => {
  it('builds /q/ from a token or hash', () => {
    expect(buildPublicQuoteUrl('abcToken', 'https://myservicelink.app')).toBe(
      'https://myservicelink.app/q/abcToken'
    );
    expect(
      buildPublicQuoteUrl(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'https://myservicelink.app'
      )
    ).toBe(
      'https://myservicelink.app/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
  });
});
