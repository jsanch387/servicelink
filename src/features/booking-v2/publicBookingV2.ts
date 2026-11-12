/**
 * Customer booking-link entry.
 * Set to false to send every business back to the current booking flow.
 * While `PUBLIC_BOOKING_V2_OWNER_EMAILS` has addresses, only those owners
 * see the new flow even when this flag is on.
 */
export const PUBLIC_BOOKING_V2_ENABLED = true;

/** Owner accounts allowed onto booking v2 during the limited rollout. */
export const PUBLIC_BOOKING_V2_OWNER_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
  'urbanink.help@gmail.com',
];

export function isPublicBookingV2OwnerEmail(
  email: string | null | undefined
): boolean {
  if (!PUBLIC_BOOKING_V2_ENABLED) return false;
  if (PUBLIC_BOOKING_V2_OWNER_EMAILS.length === 0) return true;
  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return PUBLIC_BOOKING_V2_OWNER_EMAILS.some(
    allowed => allowed.toLowerCase() === normalized
  );
}
