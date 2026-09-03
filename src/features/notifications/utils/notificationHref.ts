import { ROUTES } from '@/constants/routes';
import type { NotificationDisplay } from '../types/notification';

export function notificationHref(notification: NotificationDisplay): string {
  if (notification.type === 'quote_request_followup') {
    return ROUTES.DASHBOARD.QUOTES;
  }
  if (notification.type === 'quote_request') {
    return ROUTES.DASHBOARD.QUOTE_REQUEST_DETAIL(notification.referenceId);
  }
  if (notification.type === 'review_submitted') {
    return ROUTES.DASHBOARD.REVIEWS;
  }
  if (
    notification.type === 'membership_subscriber' ||
    notification.type === 'membership_visit_needed'
  ) {
    return ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER(notification.referenceId);
  }
  return ROUTES.DASHBOARD.BOOKINGS;
}
