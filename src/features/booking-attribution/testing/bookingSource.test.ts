import { describe, expect, it } from 'vitest';
import { BOOKING_SOURCES, isBookingSource } from '../constants';
import { formatBookingOriginLabel } from '../utils/bookingOriginLabels';

describe('isBookingSource', () => {
  it('accepts every known origin', () => {
    for (const source of BOOKING_SOURCES) {
      expect(isBookingSource(source)).toBe(true);
    }
  });

  it('rejects unknown, empty, and non-string values', () => {
    expect(isBookingSource('marketplace')).toBe(false);
    expect(isBookingSource('owner ')).toBe(false);
    expect(isBookingSource('')).toBe(false);
    expect(isBookingSource(null)).toBe(false);
    expect(isBookingSource(undefined)).toBe(false);
  });
});

describe('formatBookingOriginLabel', () => {
  it('labels the appointment type and marketplace channel', () => {
    expect(formatBookingOriginLabel('public', null)).toBe('Booking link');
    expect(formatBookingOriginLabel('public', 'marketplace')).toBe(
      'Booking link · Find detailers'
    );
    expect(formatBookingOriginLabel('quote', 'marketplace')).toBe(
      'Quote · Find detailers'
    );
    expect(formatBookingOriginLabel('owner', null)).toBe('Owner created');
  });

  it('returns null for unknown origin', () => {
    expect(formatBookingOriginLabel(null, 'marketplace')).toBeNull();
  });
});
