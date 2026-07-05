import { describe, expect, it } from 'vitest';

import {
  hasMarketingUtmData,
  parseMarketingUtmsFromSearchParams,
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
