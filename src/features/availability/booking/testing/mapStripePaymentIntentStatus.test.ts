import { mapStripePaymentIntentStatus } from '@/features/availability/booking/server/mapStripePaymentIntentStatus';
import { describe, expect, it } from 'vitest';

describe('mapStripePaymentIntentStatus', () => {
  it('passes through known Stripe statuses', () => {
    expect(mapStripePaymentIntentStatus('requires_confirmation')).toBe(
      'requires_confirmation'
    );
    expect(mapStripePaymentIntentStatus('requires_action')).toBe(
      'requires_action'
    );
    expect(mapStripePaymentIntentStatus('succeeded')).toBe('succeeded');
  });

  it('falls back to created for unknown statuses', () => {
    expect(mapStripePaymentIntentStatus('unknown')).toBe('created');
    expect(mapStripePaymentIntentStatus(null)).toBe('created');
  });
});
