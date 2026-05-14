/**
 * Notifications feature – in-app notifications (e.g. new booking request).
 */

export { NotificationBell } from './components/NotificationBell';
export { useNotifications } from './hooks/useNotifications';
export type {
  Notification,
  NotificationDisplay,
  NotificationType,
} from './types/notification';
export { notificationToDisplay } from './types/notification';
export {
  notificationInboxSubtitleFromCustomer,
  notificationMinimalDisplayTitle,
} from './utils/notificationMinimalDisplayTitle';
