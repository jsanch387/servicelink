import { notificationMinimalDisplayTitle } from '@/features/notifications/utils/notificationMinimalDisplayTitle';

export const OWNER_BOOKING_REMINDER_TYPE = 'booking_reminder';

/** Existing mobile screen slug — bookings / calendar, no booking UUID. */
export const OWNER_BOOKING_REMINDER_REFERENCE_TYPE = 'screen';
export const OWNER_BOOKING_REMINDER_REFERENCE_ID = 'bookings';

/**
 * `notifications.reference_id` is a UUID column. Push `data` still uses the
 * `bookings` screen slug; the inbox row uses this stable placeholder.
 */
export const OWNER_BOOKING_REMINDER_INBOX_REFERENCE_ID =
  '00000000-0000-4000-a000-0000000000b1';

export const OWNER_BOOKING_REMINDER_BODY =
  'You have an appointment coming up.';

export function ownerBookingReminderTitle(): string {
  return notificationMinimalDisplayTitle(
    OWNER_BOOKING_REMINDER_TYPE,
    OWNER_BOOKING_REMINDER_REFERENCE_TYPE,
    'Upcoming appointment'
  );
}

export function ownerBookingReminderBody(): string {
  return OWNER_BOOKING_REMINDER_BODY;
}

/** One reminder per owner per target calendar date. */
export function ownerBookingReminderDedupeKey(
  profileId: string,
  targetDate: string
): string {
  return `booking_reminder:${profileId.trim()}:${targetDate.trim()}`;
}
