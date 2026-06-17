/**
 * Customer-facing SMS message templates for V2 availability bookings.
 * Keep messages short (single SMS segment where possible) and always include
 * opt-out language for carrier (A2P) compliance.
 */

import { formatBookingWallTime } from '@/features/availability/booking/utils/formatBookingWallTime';

const OPT_OUT = 'Reply STOP to opt out.';

export interface BookingSmsContext {
  businessName: string;
  /** YYYY-MM-DD */
  scheduledDate: string;
  /** HH:mm 24h wall time */
  startTime: string;
}

/** Formats a `YYYY-MM-DD` date as e.g. "Mon, Jun 15" without timezone drift. */
function formatBookingDate(scheduledDate: string): string {
  const [y, m, d] = scheduledDate.split('-').map(Number);
  if (!y || !m || !d) return scheduledDate;
  // Date-only, constructed in local time (month is 0-based) so no tz shift.
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatWhen(ctx: BookingSmsContext): string {
  return `${formatBookingDate(ctx.scheduledDate)} at ${formatBookingWallTime(ctx.startTime, 'en')}`;
}

export function buildBookingConfirmedSms(ctx: BookingSmsContext): string {
  return `Your appointment with ${ctx.businessName} is confirmed for ${formatWhen(ctx)}. ${OPT_OUT}`;
}

export function buildBookingReminderSms(ctx: BookingSmsContext): string {
  return `Reminder: your appointment with ${ctx.businessName} is coming up on ${formatWhen(ctx)}. ${OPT_OUT}`;
}

/** Sent when the business marks themselves en route to the customer's appointment. */
export function buildOnMyWaySms(ctx: { businessName: string }): string {
  return `${ctx.businessName} is on the way for your appointment. ${OPT_OUT}`;
}

/** Sent when the business marks the job as started / in progress. */
export function buildJobStartedSms(ctx: { businessName: string }): string {
  return `${ctx.businessName} has started your service. ${OPT_OUT}`;
}

/** Sent when the business marks the job complete. */
export function buildJobCompletedSms(ctx: { businessName: string }): string {
  return `${ctx.businessName} has completed your appointment. Thank you! ${OPT_OUT}`;
}

/**
 * Sent on completion when the customer is eligible to leave a review. This is
 * the single, priority completion notification — it folds the thank-you into a
 * review ask with the one-time review link (no separate "completed" text).
 */
export function buildReviewRequestSms(ctx: {
  businessName: string;
  reviewUrl: string;
}): string {
  return `Thank you for choosing ${ctx.businessName}! Could you leave us a quick review? ${ctx.reviewUrl} ${OPT_OUT}`;
}
