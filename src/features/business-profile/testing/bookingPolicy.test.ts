import { describe, expect, it } from 'vitest';
import {
  BOOKING_POLICY_REQUIRED_ERROR,
  PUBLIC_BOOKING_POLICY_REQUIRED_ERROR,
  bookingPolicyPersistFromUi,
  bookingPolicyUiFromProfile,
  publicBookingPolicyError,
  resolvePublicBookingPolicy,
  validateBookingPolicyUi,
} from '../utils/bookingPolicy';

describe('bookingPolicy', () => {
  it('turns on only when there is policy text', () => {
    expect(
      bookingPolicyPersistFromUi({ enabled: true, text: '  Cancel 24h  ' })
    ).toEqual({
      booking_policy_enabled: true,
      booking_policy_text: 'Cancel 24h',
    });
    expect(bookingPolicyPersistFromUi({ enabled: true, text: '   ' })).toEqual({
      booking_policy_enabled: false,
      booking_policy_text: null,
    });
  });

  it('requires text when the switch is on', () => {
    expect(validateBookingPolicyUi({ enabled: true, text: '' })).toBe(
      BOOKING_POLICY_REQUIRED_ERROR
    );
    expect(
      validateBookingPolicyUi({ enabled: true, text: 'Be on time' })
    ).toBeNull();
  });

  it('exposes public policy only when enabled with text', () => {
    expect(
      resolvePublicBookingPolicy({
        booking_policy_enabled: true,
        booking_policy_text: 'No-shows are charged',
      })
    ).toEqual({ text: 'No-shows are charged' });
    expect(
      resolvePublicBookingPolicy({
        booking_policy_enabled: false,
        booking_policy_text: 'No-shows are charged',
      })
    ).toBeNull();
  });

  it('blocks public booking until the customer agrees', () => {
    expect(
      publicBookingPolicyError({
        ownerManualBooking: false,
        agreedToPolicy: false,
        policyRequired: true,
      })
    ).toBe(PUBLIC_BOOKING_POLICY_REQUIRED_ERROR);
    expect(
      publicBookingPolicyError({
        ownerManualBooking: true,
        agreedToPolicy: false,
        policyRequired: true,
      })
    ).toBeNull();
  });

  it('reads profile columns into edit state', () => {
    expect(
      bookingPolicyUiFromProfile({
        booking_policy_enabled: true,
        booking_policy_text: 'Late fee',
      })
    ).toEqual({ enabled: true, text: 'Late fee' });
  });
});
