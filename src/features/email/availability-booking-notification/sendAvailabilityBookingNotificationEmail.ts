/**
 * Sends the "new availability booking" email to the business owner (V2).
 * Used when a customer completes a booking on the public availability page.
 */

import { ROUTES } from '@/constants/routes';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '../services/resendClient';
import {
  buildAvailabilityBookingNotificationHtml,
  getAvailabilityBookingNotificationSubject,
} from './availabilityBookingNotificationTemplate';
import type {
  AvailabilityBookingNotificationPayload,
  SendAvailabilityBookingNotificationResult,
} from './types';

/**
 * Sends the new-availability-booking notification email to the given address.
 * Returns { sent: true } on success, { sent: false, error } on failure.
 */
export async function sendAvailabilityBookingNotificationEmail(
  to: string,
  payload: AvailabilityBookingNotificationPayload
): Promise<SendAvailabilityBookingNotificationResult> {
  const client = getResendClient();
  if (!client) {
    return { sent: false, error: 'RESEND_API_KEY is not set' };
  }

  const baseUrl = getAppBaseUrl();
  const dashboardBookingsUrl = `${baseUrl}${ROUTES.DASHBOARD.BOOKINGS}`;
  const subject = getAvailabilityBookingNotificationSubject(
    payload.customerName
  );
  const html = buildAvailabilityBookingNotificationHtml(
    payload,
    dashboardBookingsUrl
  );

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
