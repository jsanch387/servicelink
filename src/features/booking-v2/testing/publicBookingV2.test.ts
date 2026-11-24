import { describe, expect, it } from 'vitest';
import { isPublicBookingV2OwnerEmail } from '../publicBookingV2';

describe('isPublicBookingV2OwnerEmail', () => {
  it('allows every owner while the rollout list is empty', () => {
    expect(isPublicBookingV2OwnerEmail('someone@example.com')).toBe(true);
    expect(isPublicBookingV2OwnerEmail('jesuss387@gmail.com')).toBe(true);
    expect(isPublicBookingV2OwnerEmail(null)).toBe(true);
  });
});
