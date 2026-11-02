import {
  QUOTE_CUSTOMER_REMINDER_AFTER_MS,
  QUOTE_CUSTOMER_REMINDER_UNTIL_MS,
} from './constants';

/**
 * Inclusive window: sent 2–4 days ago. Daily cron then lands once at day 2 or 3.
 */
export function quoteCustomerReminderBounds(now: Date = new Date()): {
  sentOnOrBeforeIso: string;
  sentOnOrAfterIso: string;
} {
  const nowMs = now.getTime();
  return {
    sentOnOrBeforeIso: new Date(
      nowMs - QUOTE_CUSTOMER_REMINDER_AFTER_MS
    ).toISOString(),
    sentOnOrAfterIso: new Date(
      nowMs - QUOTE_CUSTOMER_REMINDER_UNTIL_MS
    ).toISOString(),
  };
}
