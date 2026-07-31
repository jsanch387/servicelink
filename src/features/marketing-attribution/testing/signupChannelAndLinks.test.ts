import { describe, expect, it } from 'vitest';

import { deriveSignupAttributionChannel } from '../utils/deriveSignupChannel';
import {
  blogGuideSignupPath,
  blogIndexSignupPath,
  siteSignupPath,
} from '../utils/signupLinks';

describe('signupLinks', () => {
  it('builds blog guide CTA with UTM params', () => {
    expect(blogGuideSignupPath('best-booking-app-for-mobile-detailers')).toBe(
      '/signup?utm_source=blog&utm_medium=cta&utm_campaign=best-booking-app-for-mobile-detailers'
    );
  });

  it('builds blog index and site CTA paths', () => {
    expect(blogIndexSignupPath()).toContain('utm_campaign=resources-index');
    expect(siteSignupPath('pricing')).toBe(
      '/signup?utm_source=site&utm_medium=cta&utm_campaign=pricing'
    );
    expect(siteSignupPath('homepage')).toContain('utm_campaign=homepage');
  });
});

describe('deriveSignupAttributionChannel', () => {
  it('classifies tagged bios and ads', () => {
    expect(
      deriveSignupAttributionChannel({
        utmSource: 'tiktok',
        utmCampaign: 'bio',
        landingPath: '/',
      })
    ).toBe('tiktok_bio');

    expect(
      deriveSignupAttributionChannel({
        utmSource: 'meta',
        utmMedium: 'ig',
        utmCampaign: 'ServiceLink - Free Tips',
        fbclid: 'abc',
      })
    ).toBe('meta_ads');

    expect(
      deriveSignupAttributionChannel({
        utmSource: 'instagram',
        utmMedium: 'dm',
        utmCampaign: 'outreach-july',
      })
    ).toBe('social_dm');
  });

  it('classifies blog and site CTAs', () => {
    expect(
      deriveSignupAttributionChannel({
        utmSource: 'blog',
        utmMedium: 'cta',
        utmCampaign: 'best-booking-app-for-mobile-detailers',
      })
    ).toBe('blog');

    expect(
      deriveSignupAttributionChannel({
        utmSource: 'site',
        utmMedium: 'cta',
        utmCampaign: 'pricing',
      })
    ).toBe('site');

    expect(
      deriveSignupAttributionChannel({
        landingPath: '/resources/best-booking-app-for-mobile-detailers',
        referrer: 'https://www.google.com/',
      })
    ).toBe('blog');
  });

  it('classifies organic search and direct', () => {
    expect(
      deriveSignupAttributionChannel({
        landingPath: '/',
        referrer: 'https://www.google.com/',
      })
    ).toBe('organic_google');

    expect(
      deriveSignupAttributionChannel({
        landingPath: '/',
      })
    ).toBe('direct');

    expect(
      deriveSignupAttributionChannel({
        landingPath: '/sudsautocare',
      })
    ).toBe('biz_profile');
  });
});
