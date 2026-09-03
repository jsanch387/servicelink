import { ROUTES } from '@/constants/routes';
import type { NotificationDisplay } from '../types/notification';
import { notificationHref } from '../utils/notificationHref';
import { describe, expect, it } from 'vitest';

function notification(
  overrides: Partial<NotificationDisplay>
): NotificationDisplay {
  return {
    id: 'n1',
    type: 'availability_booking',
    title: 'New appointment',
    body: 'From Jane',
    referenceId: 'ref-1',
    readAt: null,
    createdAt: '2026-09-02T12:00:00.000Z',
    ...overrides,
  };
}

describe('notificationHref', () => {
  it('routes quote, review, membership, and booking types', () => {
    expect(
      notificationHref(notification({ type: 'quote_request_followup' }))
    ).toBe(ROUTES.DASHBOARD.QUOTES);
    expect(notificationHref(notification({ type: 'quote_request' }))).toBe(
      ROUTES.DASHBOARD.QUOTE_REQUEST_DETAIL('ref-1')
    );
    expect(notificationHref(notification({ type: 'review_submitted' }))).toBe(
      ROUTES.DASHBOARD.REVIEWS
    );
    expect(
      notificationHref(notification({ type: 'membership_subscriber' }))
    ).toBe(ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER('ref-1'));
    expect(notificationHref(notification({ type: 'booking_reminder' }))).toBe(
      ROUTES.DASHBOARD.BOOKINGS
    );
  });
});
