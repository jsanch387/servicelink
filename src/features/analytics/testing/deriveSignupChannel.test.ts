import { describe, expect, it } from 'vitest';
import { deriveSignupChannel } from '../signupAttribution';

describe('deriveSignupChannel', () => {
  it('maps Facebook ads', () => {
    expect(
      deriveSignupChannel({
        utm_source: 'facebook',
        utm_medium: 'paid',
        utm_campaign: 'spring',
        referrer: null,
      })
    ).toBe('Facebook / Meta');
  });

  it('maps TikTok', () => {
    expect(
      deriveSignupChannel({
        utm_source: 'tiktok',
        utm_medium: 'paid',
        utm_campaign: null,
        referrer: null,
      })
    ).toBe('TikTok');
  });

  it('maps Google Ads from medium', () => {
    expect(
      deriveSignupChannel({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'brand',
        referrer: null,
      })
    ).toBe('Google Ads');
  });

  it('maps referrer when no utm', () => {
    expect(
      deriveSignupChannel({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: 'https://www.tiktok.com/@user',
      })
    ).toBe('TikTok');
  });

  it('falls back to direct', () => {
    expect(
      deriveSignupChannel({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null,
      })
    ).toBe('Direct / Unknown');
  });
});
