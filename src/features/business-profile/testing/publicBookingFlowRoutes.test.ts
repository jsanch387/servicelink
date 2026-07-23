import {
  DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE,
  getBusinessBookDetailsUrl,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  getPublicBusinessProfilePath,
  getPublicQuoteRequestPath,
  isPublicBookingFlowLocale,
  OWNER_MANUAL_BOOKING_FOR,
  PUBLIC_BOOKING_FLOW_LANG_QUERY,
} from '@/constants/routes';
import { describe, expect, it } from 'vitest';

describe('public booking flow route helpers', () => {
  describe('isPublicBookingFlowLocale', () => {
    it('accepts supported codes', () => {
      expect(isPublicBookingFlowLocale('en')).toBe(true);
      expect(isPublicBookingFlowLocale('es')).toBe(true);
    });

    it('rejects unknown and empty', () => {
      expect(isPublicBookingFlowLocale('fr')).toBe(false);
      expect(isPublicBookingFlowLocale('')).toBe(false);
      expect(isPublicBookingFlowLocale(undefined)).toBe(false);
    });
  });

  describe('getPublicBusinessProfilePath', () => {
    it('omits lang query for default locale', () => {
      expect(getPublicBusinessProfilePath('acme-auto')).toBe('/acme-auto');
      expect(
        getPublicBusinessProfilePath('acme-auto', {
          lang: DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE,
        })
      ).toBe('/acme-auto');
    });

    it('appends lang for Spanish', () => {
      expect(getPublicBusinessProfilePath('acme-auto', { lang: 'es' })).toBe(
        `/acme-auto?${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`
      );
    });

    it('encodes slug', () => {
      expect(getPublicBusinessProfilePath('a b')).toBe('/a%20b');
    });
  });

  describe('getPublicQuoteRequestPath', () => {
    it('omits lang for default', () => {
      expect(getPublicQuoteRequestPath('acme-auto')).toBe('/acme-auto/quote');
    });

    it('appends lang for non-default', () => {
      expect(getPublicQuoteRequestPath('acme-auto', { lang: 'es' })).toBe(
        `/acme-auto/quote?${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`
      );
    });
  });

  describe('getBusinessBookPath', () => {
    it('does not append lang for default locale', () => {
      expect(getBusinessBookPath('acme-auto', { lang: 'en' })).toBe(
        '/acme-auto/book'
      );
    });

    it('appends lang=es after base path', () => {
      expect(getBusinessBookPath('acme-auto', { lang: 'es' })).toBe(
        `/acme-auto/book?${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`
      );
    });

    it('combines owner flag and lang', () => {
      const u = getBusinessBookPath('acme-auto', {
        forOwner: true,
        lang: 'es',
      });
      expect(u).toContain(`for=${OWNER_MANUAL_BOOKING_FOR}`);
      expect(u).toContain(`${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`);
    });
  });

  describe('getBusinessBookDetailsUrl', () => {
    it('includes serviceId and optional lang', () => {
      expect(
        getBusinessBookDetailsUrl('acme-auto', {
          serviceId: 'svc-1',
          lang: 'es',
        })
      ).toBe(
        `/acme-auto/book/details?serviceId=svc-1&${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`
      );
    });

    it('preserves location step and serviceLocationType', () => {
      const u = getBusinessBookDetailsUrl('acme-auto', {
        serviceId: 'svc-1',
        detailsStep: 'location',
        serviceLocationType: 'mobile',
      });
      expect(u).toContain('detailsStep=location');
      expect(u).toContain('serviceLocationType=mobile');
    });
  });

  describe('getBusinessBookScheduleUrl', () => {
    it('preserves skipDetails and lang', () => {
      const u = getBusinessBookScheduleUrl('acme-auto', {
        serviceId: 'svc-1',
        skipDetails: true,
        lang: 'es',
      });
      expect(u).toContain('serviceId=svc-1');
      expect(u).toContain('skipDetails=1');
      expect(u).toContain(`${PUBLIC_BOOKING_FLOW_LANG_QUERY}=es`);
    });

    it('preserves serviceLocationType for both-mode bookings', () => {
      const u = getBusinessBookScheduleUrl('acme-auto', {
        serviceId: 'svc-1',
        detailsStep: 'location',
        serviceLocationType: 'shop',
      });
      expect(u).toContain('detailsStep=location');
      expect(u).toContain('serviceLocationType=shop');
    });
  });
});
