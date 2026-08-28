import { describe, expect, it } from 'vitest';

import {
  buildPaidConversionReport,
  isCurrentlyPayingSubscriber,
  isPaidAdChannel,
  parsePaidConversionPeriod,
  signedUpAtCutoffIso,
} from '../utils/paidConversion';

describe('paidConversion helpers', () => {
  it('classifies paid ad channels', () => {
    expect(isPaidAdChannel('meta_ads')).toBe(true);
    expect(isPaidAdChannel('paid_search')).toBe(true);
    expect(isPaidAdChannel('instagram_bio')).toBe(false);
  });

  it('parses report periods', () => {
    expect(parsePaidConversionPeriod('30d')).toBe('30d');
    expect(parsePaidConversionPeriod('weird')).toBe('all');
  });

  it('computes signed-up cutoffs', () => {
    const now = new Date('2026-08-27T12:00:00.000Z');
    expect(signedUpAtCutoffIso('all', now)).toBeNull();
    expect(signedUpAtCutoffIso('30d', now)).toBe('2026-07-28T12:00:00.000Z');
  });

  it('treats billed active/trialing Pro as currently paying', () => {
    expect(
      isCurrentlyPayingSubscriber({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
      })
    ).toBe(true);
    expect(
      isCurrentlyPayingSubscriber({
        subscription_tier: 'pro',
        subscription_status: 'canceled',
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
      })
    ).toBe(false);
    expect(
      isCurrentlyPayingSubscriber({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
    ).toBe(false);
  });
});

describe('buildPaidConversionReport', () => {
  it('splits ad-sourced signups from organic and tracks ever vs still paying', () => {
    const report = buildPaidConversionReport(
      [
        {
          channel: 'meta_ads',
          utm_campaign: 'launch',
          utm_source: 'facebook',
          utm_medium: 'paid',
          signed_up_at: '2026-08-01T00:00:00.000Z',
          first_paid_at: '2026-08-03T00:00:00.000Z',
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_subscription_id: 'sub_live',
          stripe_customer_id: 'cus_live',
        },
        {
          channel: 'meta_ads',
          utm_campaign: 'launch',
          utm_source: 'facebook',
          utm_medium: 'paid',
          signed_up_at: '2026-08-02T00:00:00.000Z',
          first_paid_at: '2026-08-04T00:00:00.000Z',
          subscription_tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: 'sub_old',
          stripe_customer_id: 'cus_old',
        },
        {
          channel: 'meta_ads',
          utm_campaign: 'launch',
          utm_source: 'facebook',
          utm_medium: 'paid',
          signed_up_at: '2026-08-05T00:00:00.000Z',
          first_paid_at: null,
          subscription_tier: 'free',
          subscription_status: null,
          stripe_subscription_id: null,
        },
        {
          channel: 'blog',
          utm_campaign: 'guide',
          utm_source: 'blog',
          utm_medium: 'cta',
          signed_up_at: '2026-08-06T00:00:00.000Z',
          first_paid_at: '2026-08-07T00:00:00.000Z',
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_subscription_id: 'sub_blog',
          stripe_customer_id: 'cus_blog',
        },
      ],
      'all',
      new Date('2026-08-27T00:00:00.000Z')
    );

    expect(report.paidAds).toMatchObject({
      signups: 3,
      everPaid: 2,
      currentlyPaying: 1,
      conversionRate: 0.667,
    });
    expect(report.totals).toMatchObject({
      signups: 4,
      everPaid: 3,
      currentlyPaying: 2,
    });

    const meta = report.byChannel.find(row => row.channel === 'meta_ads');
    expect(meta).toMatchObject({
      signups: 3,
      everPaid: 2,
      currentlyPaying: 1,
    });
    expect(report.byCampaign[0]).toMatchObject({
      campaign: 'launch',
      channel: 'meta_ads',
      signups: 3,
    });
  });
});
