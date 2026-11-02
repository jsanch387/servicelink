import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { MARKETING_UTM_COOKIE_NAME } from '../constants';
import { applyMarketingAttributionCookie } from '../server/applyMarketingAttributionCookie';
import { decodeMarketingAttributionCookie } from '../utils/attributionCookie';

describe('applyMarketingAttributionCookie', () => {
  it('persists Meta click params on first landing', () => {
    const request = new NextRequest(
      'https://myservicelink.app/?utm_source=meta&utm_medium=paid&utm_campaign=sep-test&utm_content=hook-a&fbclid=abc123'
    );
    const response = NextResponse.next();

    applyMarketingAttributionCookie(request, response);

    const raw = response.cookies.get(MARKETING_UTM_COOKIE_NAME)?.value;
    const stored = decodeMarketingAttributionCookie(raw);
    expect(stored?.utmSource).toBe('meta');
    expect(stored?.utmContent).toBe('hook-a');
    expect(stored?.fbclid).toBe('abc123');
    expect(stored?.landingPath).toBe('/');
  });

  it('does not overwrite a stored Meta click with a later bare homepage visit', () => {
    const first = new NextRequest(
      'https://myservicelink.app/?utm_source=meta&utm_medium=paid&utm_content=hook-a&fbclid=abc123'
    );
    const firstResponse = NextResponse.next();
    applyMarketingAttributionCookie(first, firstResponse);
    const firstCookie = firstResponse.cookies.get(
      MARKETING_UTM_COOKIE_NAME
    )?.value;

    const later = new NextRequest('https://myservicelink.app/');
    if (firstCookie) {
      later.cookies.set(MARKETING_UTM_COOKIE_NAME, firstCookie);
    }
    const laterResponse = NextResponse.next();
    applyMarketingAttributionCookie(later, laterResponse);

    expect(
      laterResponse.cookies.get(MARKETING_UTM_COOKIE_NAME)
    ).toBeUndefined();
  });
});
