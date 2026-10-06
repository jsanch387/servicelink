/**
 * Customer-facing SMS templates (ServiceLink toll-free sender).
 * Lead with the business name so the customer knows who the text is from.
 * Keep messages short; opt-out always sits on its own line for clarity.
 */

import { formatBookingWallTime } from '@/features/availability/booking/utils/formatBookingWallTime';

const OPT_OUT = 'Reply STOP to opt out.';

/** Body, blank line, then opt-out (carrier compliance). */
function withOptOut(body: string): string {
  return `${body.trim()}\n\n${OPT_OUT}`;
}

function smsBusinessName(name: string | null | undefined): string {
  return name?.trim() || 'Your service provider';
}

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
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(
    `Your appointment with ${name} is confirmed for ${date} at ${time}.`
  );
}

export function buildBookingReminderSms(ctx: BookingSmsContext): string {
  const { date, time } = formatDateAndTime(ctx);
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(
    `Reminder: Your appointment with ${name} is coming up on ${date} at ${time}.`
  );
}

/** Next membership period — customer should pick a visit via scheduleUrl. */
export function buildMembershipVisitReminderSms(ctx: {
  businessName: string;
  scheduleUrl: string;
}): string {
  const name = smsBusinessName(ctx.businessName);
  const url = ctx.scheduleUrl.trim();
  return withOptOut(
    url
      ? `${name}: Your subscription period started. Schedule your visit: ${url}`
      : `${name}: Your subscription period started. Schedule your visit.`
  );
}

/**
 * Owner “Send schedule link” (e.g. after a canceled visit) — ask to book,
 * without implying a new billing period started.
 */
export function buildMembershipScheduleLinkSms(ctx: {
  businessName: string;
  scheduleUrl: string;
}): string {
  const name = smsBusinessName(ctx.businessName);
  const url = ctx.scheduleUrl.trim();
  return withOptOut(
    url
      ? `${name}: Your subscription needs a date for the next visit: ${url}`
      : `${name}: Your subscription needs a date for the next visit.`
  );
}

/** Sent when the business marks themselves en route. */
export function buildOnMyWaySms(ctx: { businessName: string }): string {
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(`${name} is on the way for your appointment.`);
}

/** Sent when the business marks the job as started / in progress. */
export function buildJobStartedSms(ctx: { businessName: string }): string {
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(`${name} has started your service.`);
}

/**
 * Sent when the owner taps Done — physical work finished, before close-out.
 */
export function buildWorkFinishedSms(ctx: { businessName: string }): string {
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(`${name} has finished your service.`);
}

/** Sent when the business marks the job complete (no receipt link). */
export function buildJobCompletedSms(ctx: { businessName: string }): string {
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(`${name} has completed your appointment. Thank you!`);
}

/**
 * Receipt SMS when an invoice link is issued on job complete.
 * When review-eligible, soft-ask in the same text (CTA lives on the receipt page —
 * no separate review SMS / review URL).
 */
/** Customer bill link. Same `/b/` URL as the invoice email. */
export function buildCustomerInvoiceSms(ctx: {
  businessName: string;
  invoiceUrl: string;
}): string {
  const name = smsBusinessName(ctx.businessName);
  const url = ctx.invoiceUrl.trim();
  return withOptOut(
    url
      ? `${name}: Your invoice is ready: ${url}`
      : `${name}: Your invoice is ready.`
  );
}

export function buildJobCompletedInvoiceSms(ctx: {
  businessName: string;
  invoiceUrl: string;
  includeReviewHint?: boolean;
}): string {
  const name = smsBusinessName(ctx.businessName);
  if (ctx.includeReviewHint) {
    return withOptOut(
      `${name}: Your receipt is ready: ${ctx.invoiceUrl}\nIf you can please leave us a review, we would appreciate that.`
    );
  }
  return withOptOut(`${name}: Your receipt is ready: ${ctx.invoiceUrl}`);
}

/**
 * Standalone review invite SMS (non-receipt paths only).
 * Prefer {@link buildJobCompletedInvoiceSms} with `includeReviewHint` when a
 * receipt is also being sent — avoid double-texting.
 */
export function buildReviewRequestSms(ctx: {
  businessName: string;
  reviewUrl: string;
}): string {
  const name = smsBusinessName(ctx.businessName);
  return withOptOut(
    `Enjoyed your service from ${name}? Leave a quick review: ${ctx.reviewUrl}`
  );
}

/**
 * Unanswered sent-quote nudge. Always include the same `/q/` URL as the email.
 * `lead` is the shared sentence from quote reminder copy.
 */
export function buildQuoteReminderSms(ctx: {
  lead: string;
  publicQuoteUrl: string;
}): string {
  const url = ctx.publicQuoteUrl.trim();
  const lead = ctx.lead.trim();
  return withOptOut(url ? `${lead} ${url}` : lead);
}
