import { resolveBookingFlowLocale } from '@/libs/bookingFlowLocale';
import { describe, expect, it } from 'vitest';

describe('resolveBookingFlowLocale', () => {
  it('prefers search param over cookie', () => {
    expect(resolveBookingFlowLocale('en', 'es')).toBe('en');
  });

  it('falls back to cookie when query missing', () => {
    expect(resolveBookingFlowLocale(undefined, 'es')).toBe('es');
  });

  it('defaults to en', () => {
    expect(resolveBookingFlowLocale(undefined, undefined)).toBe('en');
    expect(resolveBookingFlowLocale('xx', 'yy')).toBe('en');
  });
});
