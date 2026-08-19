import { describe, expect, it } from 'vitest';
import { membershipLookupPhoneVariants } from '../server/findLiveCustomerMembership';

describe('membershipLookupPhoneVariants', () => {
  it('matches 10-digit and +1 stored forms', () => {
    expect(membershipLookupPhoneVariants('(580) 754-5207').sort()).toEqual(
      ['15807545207', '5807545207'].sort()
    );
    expect(membershipLookupPhoneVariants('+15807545207').sort()).toEqual(
      ['15807545207', '5807545207'].sort()
    );
  });

  it('returns empty when there is no phone', () => {
    expect(membershipLookupPhoneVariants('')).toEqual([]);
    expect(membershipLookupPhoneVariants(null)).toEqual([]);
  });
});
