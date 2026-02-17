/**
 * HTML template for the "new booking request" email sent to the business owner.
 */

import { escapeHtml } from '../utils/escapeHtml';
import type { BookingNotificationPayload } from './types';

export function buildBookingNotificationHtml(
  payload: BookingNotificationPayload,
  dashboardBookingsUrl: string
): string {
  const timeWindowLabel =
    payload.preferredTimeWindow === 'morning'
      ? 'Morning'
      : payload.preferredTimeWindow === 'afternoon'
        ? 'Afternoon'
        : 'Evening';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New booking request from ${escapeHtml(payload.customerName)}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0;">New booking request</h2>
  <p>You have a new booking request and can review it in your dashboard.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Customer</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.customerName)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.serviceName)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Preferred date</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(payload.preferredDate)}</td></tr>
    <tr><td style="padding: 8px 0;"><strong>Preferred time</strong></td><td style="padding: 8px 0;">${escapeHtml(timeWindowLabel)}</td></tr>
  </table>
  <p>
    <a href="${escapeHtml(dashboardBookingsUrl)}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px;">View bookings in dashboard</a>
  </p>
  <p style="color: #666; font-size: 14px;">This email was sent because a customer submitted a booking request on your profile.</p>
</body>
</html>
`.trim();
}

export function getBookingNotificationSubject(customerName: string): string {
  return `New booking request from ${customerName}`;
}
