import { DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE } from '@/constants/routes';
import {
  normalizePublicBookingOfferedLocales,
  resolveBookingFlowLocale,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { describe, expect, it } from 'vitest';

describe('resolveBookingFlowLocale', () => {
  it('prefers search param over cookie', () => {
    expect(resolveBookingFlowLocale('en', 'es')).toBe('en');
  });

  it('falls back to cookie when query missing', () => {
    expect(resolveBookingFlowLocale(undefined, 'es')).toBe('es');
  });

  it(`defaults to DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE (${DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE})`, () => {
    expect(resolveBookingFlowLocale(undefined, undefined)).toBe(
      DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE
    );
    expect(resolveBookingFlowLocale('xx', 'yy')).toBe(
      DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE
    );
  });
});

describe('normalizePublicBookingOfferedLocales', () => {
  it('defaults to English when empty or invalid', () => {
    expect(normalizePublicBookingOfferedLocales(null)).toEqual(['en']);
    expect(normalizePublicBookingOfferedLocales(undefined)).toEqual(['en']);
    expect(normalizePublicBookingOfferedLocales([])).toEqual(['en']);
  });

  it('orders en first then es', () => {
    expect(normalizePublicBookingOfferedLocales(['es', 'en'])).toEqual([
      'en',
      'es',
    ]);
  });
});

describe('resolvePublicBookingFlowLocale', () => {
  const bilingual = ['en', 'es'] as const;

  it('uses only offered locale when business is English-only', () => {
    expect(
      resolvePublicBookingFlowLocale({
        offeredLocales: ['en'],
        businessDefaultLocale: 'en',
        searchParamsLang: 'es',
        cookieValue: 'es',
      })
    ).toBe('en');
  });

  it('prefers query when valid and offered', () => {
    expect(
      resolvePublicBookingFlowLocale({
        offeredLocales: [...bilingual],
        businessDefaultLocale: 'en',
        searchParamsLang: 'es',
        cookieValue: 'en',
      })
    ).toBe('es');
  });

  it('uses DB default after invalid query and cookie', () => {
    expect(
      resolvePublicBookingFlowLocale({
        offeredLocales: [...bilingual],
        businessDefaultLocale: 'es',
        searchParamsLang: 'fr',
        cookieValue: 'xx',
      })
    ).toBe('es');
  });

  it('uses cookie when query missing and cookie is offered', () => {
    expect(
      resolvePublicBookingFlowLocale({
        offeredLocales: [...bilingual],
        businessDefaultLocale: 'en',
        searchParamsLang: undefined,
        cookieValue: 'es',
      })
    ).toBe('es');
  });

  it('falls back to first offered when DB default is invalid', () => {
    expect(
      resolvePublicBookingFlowLocale({
        offeredLocales: [...bilingual],
        businessDefaultLocale: 'pt',
        searchParamsLang: undefined,
        cookieValue: undefined,
      })
    ).toBe('en');
  });
});
