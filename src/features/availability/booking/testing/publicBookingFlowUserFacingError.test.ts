import { describe, expect, it } from 'vitest';
import { publicBookingFlowUserFacingError } from '../utils/publicBookingFlowUserFacingError';

describe('publicBookingFlowUserFacingError', () => {
  it('returns safe checkout fallback for Stripe-style messages', () => {
    const raw =
      "The provided key 'sk_test_***gd53zB' does not have access to account 'acct_1TOKVm2zPrz1TlTS' (or that account does not exist). Application access may have been revoked.";
    expect(publicBookingFlowUserFacingError(raw, 'checkout')).toBe(
      'Could not start checkout.'
    );
    expect(publicBookingFlowUserFacingError(raw, 'booking')).toBe(
      'Something went wrong. Please try again.'
    );
    expect(publicBookingFlowUserFacingError(raw, 'checkout', 'es')).toBe(
      'No se pudo iniciar el pago. Vuelve a intentarlo o contacta al negocio.'
    );
  });

  it('passes through short validation-style errors', () => {
    expect(
      publicBookingFlowUserFacingError('Customer name is required', 'booking')
    ).toBe('Customer name is required');
  });

  it('handles non-string input', () => {
    expect(publicBookingFlowUserFacingError(null, 'checkout')).toBe(
      'Could not start checkout.'
    );
  });
});
