/** Inbox + Expo type. Distinct from `quote_request` so it does not say “New quote request”. */
export const QUOTE_REQUEST_FOLLOW_UP_TYPE = 'quote_request_followup';

/** Mobile already routes this slug to the quotes list. */
export const QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE = 'screen';
export const QUOTE_REQUEST_FOLLOW_UP_REFERENCE_ID = 'quotes';

/**
 * `notifications.reference_id` is a UUID column. Push `data` still uses
 * `quotes`; the inbox row uses this placeholder.
 */
export const QUOTE_REQUEST_FOLLOW_UP_INBOX_REFERENCE_ID =
  '00000000-0000-4000-a000-000000000071';

export const QUOTE_REQUEST_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/** Daily nudges after it goes stale, then stop. The request stays open. */
export const QUOTE_REQUEST_FOLLOW_UP_DAYS = 3;

/** Same clock as booking reminders so “today” is stable across cron runs. */
export const QUOTE_REQUEST_FOLLOW_UP_TIMEZONE = 'America/Chicago';

/** Wait at least 2 days after `quotes.sent_at` before nudging the customer. */
export const QUOTE_CUSTOMER_REMINDER_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Stop considering the quote 4 days after send. Daily cron therefore hits
 * once in the 2–3 day window the product asked for.
 */
export const QUOTE_CUSTOMER_REMINDER_UNTIL_MS = 4 * 24 * 60 * 60 * 1000;

export const QUOTE_CUSTOMER_REMINDER_STATUSES = ['sent', 'viewed'] as const;

export const QUOTE_CUSTOMER_REMINDER_SMS_TYPE = 'quote_reminder';

export const QUOTE_CUSTOMER_REMINDER_SEND_CONCURRENCY = 5;
