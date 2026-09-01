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
