import { describe, expect, it } from 'vitest';
import { buildAvailabilityBookingEmailServiceLocation } from '../availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';

describe('buildAvailabilityBookingEmailServiceLocation', () => {
  it('uses the shop label for shop emails, not the customer or serving city', () => {
    expect(
      buildAvailabilityBookingEmailServiceLocation({
        effectiveType: 'shop',
        shopAddressLabel: '410 E Pecan St, Pflugerville, TX 78660',
        customerStreet: '123 Main St',
        customerCity: 'Austin',
        customerState: 'TX',
        customerZip: '78701',
      })
    ).toEqual({
      type: 'shop',
      formattedAddress: '410 E Pecan St, Pflugerville, TX 78660',
    });
  });

  it('formats the customer address for mobile emails', () => {
    expect(
      buildAvailabilityBookingEmailServiceLocation({
        effectiveType: 'mobile',
        shopAddressLabel: '410 E Pecan St, Pflugerville, TX 78660',
        customerStreet: '123 Main St',
        customerCity: 'Austin',
        customerState: 'TX',
        customerZip: '78701',
      })
    ).toEqual({
      type: 'mobile',
      formattedAddress: '123 Main St, Austin, TX 78701',
    });
  });
});
