import { notificationMinimalDisplayTitle } from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import {
  QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
  QUOTE_REQUEST_FOLLOW_UP_TYPE,
} from './constants';

export function quoteRequestFollowUpTitle(): string {
  return notificationMinimalDisplayTitle(
    QUOTE_REQUEST_FOLLOW_UP_TYPE,
    QUOTE_REQUEST_FOLLOW_UP_REFERENCE_TYPE,
    'Quote request waiting'
  );
}

export function quoteRequestFollowUpBody(count: number): string {
  if (count <= 1) return '1 quote is waiting on you.';
  return `${count} quotes are waiting on you.`;
}

/** One digest per owner per local calendar day. */
export function quoteRequestFollowUpDedupeKey(
  profileId: string,
  localDateYmd: string
): string {
  return `quote_request_followup:${profileId.trim()}:${localDateYmd.trim()}`;
}
