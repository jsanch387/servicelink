/**
 * Sends the "new booking request" email to the business owner.
 * Used when a customer submits a booking on a public profile.
 */

import { ROUTES } from '@/constants/routes';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import {
  buildBookingNotificationHtml,
  getBookingNotificationSubject,
} from './bookingNotificationTemplate';
import type {
  BookingNotificationPayload,
  SendBookingNotificationResult,
} from './types';

/**
 * Sends the new-booking notification email to the given address.
 * Returns { sent: true } on success, { sent: false, error } on failure.
 */
export async function sendBookingNotificationEmail(
  to: string,
  payload: BookingNotificationPayload
): Promise<SendBookingNotificationResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const baseUrl = getAppBaseUrl();
  const dashboardBookingsUrl = `${baseUrl}${ROUTES.DASHBOARD.BOOKINGS}`;
  const subject = getBookingNotificationSubject(payload.customerName);
  const html = buildBookingNotificationHtml(payload, dashboardBookingsUrl);

  const { data, error } = await client.emails.send({
    from: getFromEmail(),
    to: [to],
    subject,
    html,
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  if (!data?.id) {
    return { sent: false, error: 'Resend did not return an id' };
  }
  return { sent: true };
}
