import { describe, expect, it } from 'vitest';
import {
  customerAlreadyReviewedForBooking,
  willSendReviewInviteOnBookingComplete,
  type ReviewInviteEligibilityContext,
} from '../server/reviewInviteEligibility';

function emptyContext(): ReviewInviteEligibilityContext {
  return {
    reviewedCustomerIds: new Set(),
    pendingInviteCustomerIds: new Set(),
    bookingIdsWithInvite: new Set(),
  };
}

describe('willSendReviewInviteOnBookingComplete', () => {
  it('returns true when booking is eligible', () => {
    expect(
      willSendReviewInviteOnBookingComplete(
        {
          id: 'booking-1',
          customer_id: 'cust-1',
          customer_email: 'jane@example.com',
        },
        emptyContext()
      )
    ).toBe(true);
  });

  it('returns false when customer already reviewed', () => {
    expect(
      willSendReviewInviteOnBookingComplete(
        {
          id: 'booking-1',
          customer_id: 'cust-1',
          customer_email: 'jane@example.com',
        },
        {
          ...emptyContext(),
          reviewedCustomerIds: new Set(['cust-1']),
        }
      )
    ).toBe(false);
  });

  it('returns false when customer has a pending invite', () => {
    expect(
      willSendReviewInviteOnBookingComplete(
        {
          id: 'booking-1',
          customer_id: 'cust-1',
          customer_email: 'jane@example.com',
        },
        {
          ...emptyContext(),
          pendingInviteCustomerIds: new Set(['cust-1']),
        }
      )
    ).toBe(false);
  });

  it('returns false when booking already has an invite', () => {
    expect(
      willSendReviewInviteOnBookingComplete(
        {
          id: 'booking-1',
          customer_id: 'cust-1',
          customer_email: 'jane@example.com',
        },
        {
          ...emptyContext(),
          bookingIdsWithInvite: new Set(['booking-1']),
        }
      )
    ).toBe(false);
  });

  it('returns false when there is no customer email', () => {
    expect(
      willSendReviewInviteOnBookingComplete(
        {
          id: 'booking-1',
          customer_id: 'cust-1',
          customer_email: '',
        },
        emptyContext()
      )
    ).toBe(false);
  });
});

describe('customerAlreadyReviewedForBooking', () => {
  it('returns true when customer has a review', () => {
    expect(
      customerAlreadyReviewedForBooking(
        { customer_id: 'cust-1' },
        {
          ...emptyContext(),
          reviewedCustomerIds: new Set(['cust-1']),
        }
      )
    ).toBe(true);
  });

  it('returns false when customer has no review', () => {
    expect(
      customerAlreadyReviewedForBooking(
        { customer_id: 'cust-1' },
        emptyContext()
      )
    ).toBe(false);
  });
});
