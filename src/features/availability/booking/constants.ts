/** Statuses that hold a time slot on the public calendar. */
export const SLOT_BLOCKING_BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'completed',
] as const;

export const BOOKINGS_LIST_DEFAULT_LIMIT = 15;
export const BOOKINGS_LIST_MAX_LIMIT = 50;
export const BOOKINGS_RANGE_MAX_DAYS = 45;
export const BOOKINGS_RANGE_MAX_ROWS = 200;
