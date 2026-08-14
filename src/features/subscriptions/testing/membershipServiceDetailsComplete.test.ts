import { describe, expect, it } from 'vitest';
import { EMPTY_MEMBERSHIP_SERVICE_DETAILS } from '../components/MembershipServiceDetailsFields';
import { isMembershipServiceDetailsComplete } from '../utils/membershipServiceDetailsComplete';

const completeDetails = {
  ...EMPTY_MEMBERSHIP_SERVICE_DETAILS,
  street: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  vehicleYear: '2018',
  vehicleMake: 'Honda',
  vehicleModel: 'Civic',
};

describe('isMembershipServiceDetailsComplete', () => {
  it('requires vehicle when it can be edited', () => {
    expect(
      isMembershipServiceDetailsComplete({
        value: { ...completeDetails, vehicleMake: '' },
        needsAddress: true,
        needsVehicle: true,
      })
    ).toBe(false);
  });

  it('skips vehicle completeness when the membership vehicle is locked', () => {
    expect(
      isMembershipServiceDetailsComplete({
        value: {
          ...completeDetails,
          vehicleYear: '',
          vehicleMake: '',
          vehicleModel: '',
        },
        needsAddress: true,
        needsVehicle: true,
        vehicleLocked: true,
      })
    ).toBe(true);
  });

  it('still requires address when the vehicle is locked', () => {
    expect(
      isMembershipServiceDetailsComplete({
        value: { ...completeDetails, street: '' },
        needsAddress: true,
        needsVehicle: true,
        vehicleLocked: true,
      })
    ).toBe(false);
  });
});
