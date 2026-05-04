/**
 * Feature flag: when true, new-booking emails + in-app notify are driven only by
 * POST /api/webhooks/supabase/bookings (DB INSERT on `bookings`). Application
 * code must not call dispatch for the same insert.
 */
export function isBookingEmailWebhookDispatchEnabled(): boolean {
  return process.env.BOOKING_EMAIL_WEBHOOK_ENABLED?.trim() === 'true';
}
