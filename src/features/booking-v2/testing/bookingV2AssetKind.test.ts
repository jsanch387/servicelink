import { describe, expect, it } from 'vitest';
import { bookingV2AssetKind } from '../bookingV2AssetKind';

describe('bookingV2AssetKind', () => {
  it('keeps vehicle businesses and unknown types on the vehicle form', () => {
    expect(bookingV2AssetKind('Auto & Detailing')).toBe('vehicle');
    expect(bookingV2AssetKind('Vehicle Services')).toBe('vehicle');
    expect(bookingV2AssetKind('Mobile Detailing')).toBe('vehicle');
    expect(bookingV2AssetKind(null)).toBe('vehicle');
    expect(bookingV2AssetKind('Something new')).toBe('vehicle');
  });

  it('asks for a pet on pet businesses', () => {
    expect(bookingV2AssetKind('Pet Services')).toBe('pet');
    expect(bookingV2AssetKind('Pet Grooming')).toBe('pet');
  });

  it('skips both for home and personal services', () => {
    expect(bookingV2AssetKind('Property Services')).toBe('none');
    expect(bookingV2AssetKind('Cleaning Services')).toBe('none');
    expect(bookingV2AssetKind('Lawn Care & Landscaping')).toBe('none');
    expect(bookingV2AssetKind('Beauty')).toBe('none');
    expect(bookingV2AssetKind('Other')).toBe('none');
  });
});
