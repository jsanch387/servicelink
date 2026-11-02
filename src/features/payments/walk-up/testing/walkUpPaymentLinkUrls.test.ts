import { ROUTES } from '@/constants/routes';
import { describe, expect, it } from 'vitest';
import {
  buildPublicPaymentLinkUrl,
  buildWalkUpPaymentCompleteUrl,
} from '../walkUpPaymentLinkUrls';

describe('buildWalkUpPaymentCompleteUrl', () => {
  it('builds the success return URL', () => {
    expect(
      buildWalkUpPaymentCompleteUrl({
        baseUrl: 'https://myservicelink.app',
      })
    ).toBe(`https://myservicelink.app${ROUTES.PAY_COMPLETE}?status=success`);

    expect(
      buildWalkUpPaymentCompleteUrl({
        baseUrl: 'https://myservicelink.app/',
      })
    ).toBe(`https://myservicelink.app${ROUTES.PAY_COMPLETE}?status=success`);
  });
});

describe('buildPublicPaymentLinkUrl', () => {
  it('builds a short /p/ share URL', () => {
    expect(
      buildPublicPaymentLinkUrl({
        baseUrl: 'https://myservicelink.app/',
        shortCode: 'K7mN2pQx',
      })
    ).toBe('https://myservicelink.app/p/K7mN2pQx');
  });
});
