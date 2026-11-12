import { describe, expect, it } from 'vitest';
import { isPublicBookingV2OwnerEmail } from '../publicBookingV2';

describe('isPublicBookingV2OwnerEmail', () => {
  it('allows only the rollout owners, ignoring case and extra space', () => {
    expect(isPublicBookingV2OwnerEmail('jesuss387@gmail.com')).toBe(true);
    expect(isPublicBookingV2OwnerEmail('urbanink.help@gmail.com')).toBe(true);
    expect(isPublicBookingV2OwnerEmail('  Jesuss387@gmail.com ')).toBe(true);
    expect(isPublicBookingV2OwnerEmail('someone@example.com')).toBe(false);
    expect(isPublicBookingV2OwnerEmail(null)).toBe(false);
  });
});
