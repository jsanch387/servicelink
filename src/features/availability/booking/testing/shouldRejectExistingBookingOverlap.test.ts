import { describe, expect, it } from 'vitest';
import { shouldRejectExistingBookingOverlap } from '../utils/shouldRejectExistingBookingOverlap';

describe('shouldRejectExistingBookingOverlap', () => {
  it('blocks public customers from taking a booked slot', () => {
    expect(shouldRejectExistingBookingOverlap(false)).toBe(true);
  });

  it('lets the owner create or reschedule onto a booked slot', () => {
    expect(shouldRejectExistingBookingOverlap(true)).toBe(false);
  });
});
