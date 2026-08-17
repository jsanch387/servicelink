/**
 * Customer-facing SMS templates (ServiceLink toll-free sender).
 * Brand is ServiceLink only — never include an individual business name.
 * Keep messages short; opt-out always sits on its own line for clarity.
 */

import { formatBookingWallTime } from '@/features/availability/booking/utils/formatBookingWallTime';

const OPT_OUT = 'Reply STOP to opt out.';

/** Body, blank line, then opt-out (carrier compliance). */
function withOptOut(body: string): string {
  return `${body.trim()}\n\n${OPT_OUT}`;
}

export interface BookingSmsContext {
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

function formatDateAndTime(ctx: BookingSmsContext): {
  date: string;
  time: string;
} {
  return {
    date: formatBookingDate(ctx.scheduledDate),
    time: formatBookingWallTime(ctx.startTime, 'en'),
  };
}

export function buildBookingConfirmedSms(ctx: BookingSmsContext): string {
  const { date, time } = formatDateAndTime(ctx);
  return withOptOut(
    `Your appointment is confirmed for ${date} at ${time}. Questions? Contact your service provider.`
  );
}

export function buildBookingReminderSms(ctx: BookingSmsContext): string {
  const { date, time } = formatDateAndTime(ctx);
  return withOptOut(
    `Reminder: Your appointment is coming up on ${date} at ${time}.`
  );
}

/** Next membership period — customer should pick a visit via scheduleUrl. */
export function buildMembershipVisitReminderSms(ctx: {
  scheduleUrl: string;
}): string {
  const url = ctx.scheduleUrl.trim();
  return withOptOut(
    url
      ? `Your membership period started. Book your next visit: ${url}`
      : `Your membership period started. Book your next visit with your provider.`
  );
}

/**
 * Owner “Send schedule link” (e.g. after a canceled visit) — ask to book,
 * without implying a new billing period started.
 */
export function buildMembershipScheduleLinkSms(ctx: {
  scheduleUrl: string;
}): string {
  const url = ctx.scheduleUrl.trim();
  return withOptOut(
    url
      ? `Book your next visit: ${url}`
      : `Book your next visit with your provider.`
  );
}

/** Sent when the business marks themselves en route. */
export function buildOnMyWaySms(ctx: { businessName: string }): string {
  const name = ctx.businessName.trim() || 'Your service provider';
  return withOptOut(`${name} is on the way for your appointment.`);
}

/** Sent when the business marks the job as started / in progress. */
export function buildJobStartedSms(): string {
  return withOptOut(`Your service has started.`);
}

/**
 * Sent when the owner taps Done — physical work finished, before close-out.
 * Not in the public template list; kept generic (no business name).
 */
export function buildWorkFinishedSms(): string {
  return withOptOut(`Your service is finished and ready for you.`);
}

/** Sent when the business marks the job complete (no receipt link). */
export function buildJobCompletedSms(): string {
  return withOptOut(`Your service is complete. Thank you!`);
}

/**
 * Receipt SMS when an invoice link is issued on job complete.
 * When review-eligible, soft-ask in the same text (CTA lives on the receipt page —
 * no separate review SMS / review URL).
 */
export function buildJobCompletedInvoiceSms(ctx: {
  invoiceUrl: string;
  includeReviewHint?: boolean;
}): string {
  if (ctx.includeReviewHint) {
    return withOptOut(
      `Your receipt is ready: ${ctx.invoiceUrl}\nIf you can please leave us a review, we would appreciate that.`
    );
  }
  return withOptOut(`Your receipt is ready: ${ctx.invoiceUrl}`);
}

/**
 * Standalone review invite SMS (non-receipt paths only).
 * Prefer {@link buildJobCompletedInvoiceSms} with `includeReviewHint` when a
 * receipt is also being sent — avoid double-texting.
 */
export function buildReviewRequestSms(ctx: { reviewUrl: string }): string {
  return withOptOut(
    `Enjoyed your service? Leave a quick review: ${ctx.reviewUrl}`
  );
}
