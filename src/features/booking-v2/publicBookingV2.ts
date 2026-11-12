/**
 * Customer booking-link entry.
 * Set to false to send every business back to the current booking flow.
 * Add owner emails here to limit the new flow to those accounts again.
 */
export const PUBLIC_BOOKING_V2_ENABLED = true;

/** Empty means every business. Add emails to limit the rollout again. */
export const PUBLIC_BOOKING_V2_OWNER_EMAILS: readonly string[] = [];

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
