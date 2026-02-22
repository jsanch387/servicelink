/**
 * Email feature – transactional emails via Resend.
 * Add new email types as subfolders (e.g. booking-notification) and re-export here.
 */

export { sendBookingNotificationEmail } from './booking-notification/sendBookingNotificationEmail';
export type {
  BookingNotificationPayload,
  SendBookingNotificationResult,
} from './booking-notification/types';
