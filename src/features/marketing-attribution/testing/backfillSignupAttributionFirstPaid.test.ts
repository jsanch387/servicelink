import { describe, expect, it } from 'vitest';

import {
  resolveStripeFirstPaidAtIso,
  summarizeBackfillBuckets,
} from '../server/backfillSignupAttributionFirstPaid';
import { isUnknownAttributionPlaceholder } from '../utils/isUnknownAttributionPlaceholder';

describe('signup attribution backfill helpers', () => {
  it('counts missing rows and null stamps separately from already stamped', () => {
    expect(
      summarizeBackfillBuckets({
        billedActive: 137,
        noAttributionRow: 58,
        rowNullFirstPaidAt: 21,
        alreadyStamped: 58,
        skippedNoStripeSubscription: 0,
      })
    ).toEqual({
      billedActive: 137,
      noAttributionRow: 58,
      rowNullFirstPaidAt: 21,
      alreadyStamped: 58,
      wouldInsertUnknown: 58,
      wouldSetFirstPaidAt: 79,
      skippedNoStripeSubscription: 0,
    });
  });

  it('prefers the earliest paid invoice over subscription start_date', () => {
    expect(
      resolveStripeFirstPaidAtIso({
        subscriptionStartDateUnix: 1_700_000_000,
        paidInvoiceUnix: [1_700_100_000, 1_700_050_000],
      })
    ).toBe(new Date(1_700_050_000 * 1000).toISOString());
  });

  it('falls back to subscription start_date when no paid invoice exists', () => {
    expect(
      resolveStripeFirstPaidAtIso({
        subscriptionStartDateUnix: 1_700_000_000,
        paidInvoiceUnix: [],
      })
    ).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });
});

describe('isUnknownAttributionPlaceholder', () => {
  const blank = {
    channel: 'unknown',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    gclid: null,
    landing_path: null,
    referrer: null,
  };

  it('matches a server unknown row and rejects a real channel', () => {
    expect(isUnknownAttributionPlaceholder(blank)).toBe(true);
    expect(
      isUnknownAttributionPlaceholder({
        ...blank,
        channel: 'meta_ads',
        utm_source: 'meta',
      })
    ).toBe(false);
  });
});
