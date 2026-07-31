import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MARKETING_UTM_STORAGE_KEY } from '../constants';
import {
  captureMarketingUtmsFromSearchParams,
  getStoredMarketingUtms,
  hasMarketingUtmData,
  isAppShellPath,
  isNonAcquisitionReferrer,
  isWeakMarketingAttribution,
  parseMarketingUtmsFromSearchParams,
  persistMarketingUtms,
} from '../utils/utmCapture';

describe('parseMarketingUtmsFromSearchParams', () => {
  it('parses standard UTM params and click ids', () => {
    const params = new URLSearchParams(
      'utm_source=facebook&utm_medium=paid&utm_campaign=launch&utm_content=ad-a&fbclid=abc&gclid=xyz'
    );
    const parsed = parseMarketingUtmsFromSearchParams(params, '/');

    expect(parsed.utmSource).toBe('facebook');
    expect(parsed.utmMedium).toBe('paid');
    expect(parsed.utmCampaign).toBe('launch');
    expect(parsed.utmContent).toBe('ad-a');
    expect(parsed.fbclid).toBe('abc');
    expect(parsed.gclid).toBe('xyz');
    expect(parsed.landingPath).toBe('/');
  });

  it('hasMarketingUtmData detects campaign params', () => {
    expect(
      hasMarketingUtmData({
        landingPath: '/',
        utmCampaign: 'spring',
      })
    ).toBe(true);
    expect(hasMarketingUtmData({ landingPath: '/' })).toBe(false);
  });
});

describe('isAppShellPath', () => {
  it('treats auth and dashboard routes as app chrome', () => {
    expect(isAppShellPath('/login')).toBe(true);
    expect(isAppShellPath('/signup')).toBe(true);
    expect(isAppShellPath('/auth/check-email')).toBe(true);
    expect(isAppShellPath('/auth/email-confirmed')).toBe(true);
    expect(isAppShellPath('/dashboard')).toBe(true);
    expect(isAppShellPath('/dashboard/bookings')).toBe(true);
  });

  it('treats marketing and public paths as landings', () => {
    expect(isAppShellPath('/')).toBe(false);
    expect(isAppShellPath('/pricing')).toBe(false);
    expect(isAppShellPath('/resources')).toBe(false);
    expect(
      isAppShellPath('/resources/best-booking-app-for-mobile-detailers')
    ).toBe(false);
    expect(isAppShellPath('/sudsautocare')).toBe(false);
  });
});

describe('isNonAcquisitionReferrer', () => {
  it('filters email confirm / OAuth / same-site referrers', () => {
    expect(isNonAcquisitionReferrer('https://accounts.google.com/')).toBe(true);
    expect(
      isNonAcquisitionReferrer('android-app://com.google.android.gm/')
    ).toBe(true);
    expect(isNonAcquisitionReferrer('https://myservicelink.app/signup')).toBe(
      true
    );
  });

  it('keeps search and social discovery referrers', () => {
    expect(isNonAcquisitionReferrer('https://www.google.com/')).toBe(false);
    expect(isNonAcquisitionReferrer('https://www.instagram.com/')).toBe(false);
    expect(isNonAcquisitionReferrer('https://www.bing.com/')).toBe(false);
  });
});

describe('persistMarketingUtms', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => '',
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('does not lock first-touch on bare /login', () => {
    persistMarketingUtms({ landingPath: '/login' });
    expect(getStoredMarketingUtms()).toBeUndefined();

    persistMarketingUtms({
      landingPath: '/resources/best-booking-app-for-mobile-detailers',
    });
    expect(getStoredMarketingUtms()?.landingPath).toBe(
      '/resources/best-booking-app-for-mobile-detailers'
    );
  });

  it('does not overwrite a blog landing when user later hits /signup', () => {
    persistMarketingUtms({
      landingPath: '/resources/best-booking-app-for-mobile-detailers',
      referrer: 'https://www.google.com/',
    });
    persistMarketingUtms({ landingPath: '/signup' });
    persistMarketingUtms({ landingPath: '/auth/check-email' });
    persistMarketingUtms({ landingPath: '/auth/email-confirmed' });
    persistMarketingUtms({ landingPath: '/dashboard' });

    const stored = getStoredMarketingUtms();
    expect(stored?.landingPath).toBe(
      '/resources/best-booking-app-for-mobile-detailers'
    );
    expect(stored?.referrer).toBe('https://www.google.com/');
  });

  it('upgrades a weak auth touch when UTMs arrive later', () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://www.google.com/',
    });
    persistMarketingUtms({ landingPath: '/login' });
    expect(getStoredMarketingUtms()?.landingPath).toBeUndefined();
    expect(getStoredMarketingUtms()?.referrer).toBe('https://www.google.com/');

    persistMarketingUtms({
      landingPath: '/',
      utmSource: 'tiktok',
      utmCampaign: 'bio',
    });

    const stored = getStoredMarketingUtms();
    expect(stored?.utmSource).toBe('tiktok');
    expect(stored?.utmCampaign).toBe('bio');
    expect(stored?.landingPath).toBe('/');
    expect(stored?.referrer).toBe('https://www.google.com/');
  });

  it('keeps first UTM touch and ignores later campaigns', () => {
    persistMarketingUtms({
      landingPath: '/',
      utmSource: 'tiktok',
      utmCampaign: 'bio',
    });
    persistMarketingUtms({
      landingPath: '/',
      utmSource: 'meta',
      utmCampaign: 'ServiceLink - Free Tips',
    });

    const stored = getStoredMarketingUtms();
    expect(stored?.utmSource).toBe('tiktok');
    expect(stored?.utmCampaign).toBe('bio');
  });

  it('ignores Gmail / Google OAuth referrers on auth return', () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'android-app://com.google.android.gm/',
    });
    persistMarketingUtms({ landingPath: '/login' });
    expect(getStoredMarketingUtms()).toBeUndefined();

    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://accounts.google.com/',
    });
    persistMarketingUtms({ landingPath: '/dashboard' });
    expect(getStoredMarketingUtms()).toBeUndefined();
  });

  it('preserves prior marketing landing when UTMs arrive on /signup', () => {
    persistMarketingUtms({ landingPath: '/pricing' });
    persistMarketingUtms({
      landingPath: '/signup',
      utmSource: 'meta',
      utmMedium: 'ig',
      utmCampaign: 'ServiceLink - Free Tips',
    });

    const stored = getStoredMarketingUtms();
    expect(stored?.landingPath).toBe('/pricing');
    expect(stored?.utmSource).toBe('meta');
  });

  it('captureMarketingUtmsFromSearchParams skips locking on /login without UTMs', () => {
    captureMarketingUtmsFromSearchParams(new URLSearchParams(), '/login');
    expect(getStoredMarketingUtms()).toBeUndefined();

    captureMarketingUtmsFromSearchParams(
      new URLSearchParams('utm_source=tiktok&utm_campaign=bio'),
      '/'
    );
    expect(getStoredMarketingUtms()?.utmSource).toBe('tiktok');
  });

  it('isWeakMarketingAttribution flags auth-only storage', () => {
    expect(isWeakMarketingAttribution(undefined)).toBe(true);
    expect(isWeakMarketingAttribution({ landingPath: '/login' })).toBe(true);
    expect(
      isWeakMarketingAttribution({ referrer: 'https://www.google.com/' })
    ).toBe(true);
    expect(isWeakMarketingAttribution({ landingPath: '/pricing' })).toBe(false);
    expect(
      isWeakMarketingAttribution({
        landingPath: '/login',
        utmSource: 'tiktok',
      })
    ).toBe(false);
  });

  it('strips legacy /login landings when reading storage', () => {
    window.localStorage.setItem(
      MARKETING_UTM_STORAGE_KEY,
      JSON.stringify({
        landingPath: '/login',
        referrer: 'android-app://com.google.android.gm/',
      })
    );

    expect(getStoredMarketingUtms()?.landingPath).toBeUndefined();
    expect(getStoredMarketingUtms()?.referrer).toBeUndefined();
  });

  it('writes to both session and local storage', () => {
    persistMarketingUtms({
      landingPath: '/',
      utmSource: 'tiktok',
      utmCampaign: 'bio',
    });
    expect(window.localStorage.getItem(MARKETING_UTM_STORAGE_KEY)).toBeTruthy();
    expect(
      window.sessionStorage.getItem(MARKETING_UTM_STORAGE_KEY)
    ).toBeTruthy();
  });
});
