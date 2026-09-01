import {
  QUOTE_REQUEST_FOLLOW_UP_DAYS,
  QUOTE_REQUEST_FOLLOW_UP_TIMEZONE,
  QUOTE_REQUEST_STALE_AFTER_MS,
} from './constants';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Eligible: older than 24h, and not older than 24h + FOLLOW_UP_DAYS. */
export function quoteRequestFollowUpBounds(now: Date = new Date()): {
  staleBeforeIso: string;
  staleOnOrAfterIso: string;
} {
  const staleBefore = now.getTime() - QUOTE_REQUEST_STALE_AFTER_MS;
  return {
    staleBeforeIso: new Date(staleBefore).toISOString(),
    staleOnOrAfterIso: new Date(
      staleBefore - QUOTE_REQUEST_FOLLOW_UP_DAYS * DAY_MS
    ).toISOString(),
  };
}

/** `YYYY-MM-DD` for `now` in `timeZone`. */
export function quoteRequestFollowUpLocalDate(
  now: Date,
  timeZone: string = QUOTE_REQUEST_FOLLOW_UP_TIMEZONE
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
