export const BOOKING_POLICY_MAX_LENGTH = 4000;

export const BOOKING_POLICY_REQUIRED_ERROR =
  'Add your customer policy or turn it off.';

export const PUBLIC_BOOKING_POLICY_REQUIRED_ERROR =
  'Agree to the booking policy to continue.';

export interface BookingPolicyUiState {
  enabled: boolean;
  text: string;
}

export function bookingPolicyUiFromProfile(profile: {
  booking_policy_enabled?: boolean | null;
  booking_policy_text?: string | null;
}): BookingPolicyUiState {
  return {
    enabled: profile.booking_policy_enabled === true,
    text: profile.booking_policy_text?.trim() ?? '',
  };
}

export function bookingPolicyPersistFromUi(ui: BookingPolicyUiState): {
  booking_policy_enabled: boolean;
  booking_policy_text: string | null;
} {
  const text = ui.text.trim().slice(0, BOOKING_POLICY_MAX_LENGTH);
  return {
    booking_policy_enabled: ui.enabled && text.length > 0,
    booking_policy_text: text.length > 0 ? text : null,
  };
}

export function validateBookingPolicyUi(
  ui: BookingPolicyUiState
): string | null {
  if (ui.enabled && !ui.text.trim()) {
    return BOOKING_POLICY_REQUIRED_ERROR;
  }
  return null;
}

/** Policy customers must accept. Null when the owner has not turned it on. */
export function resolvePublicBookingPolicy(profile: {
  booking_policy_enabled?: boolean | null;
  booking_policy_text?: string | null;
}): { text: string } | null {
  const persist = bookingPolicyPersistFromUi(
    bookingPolicyUiFromProfile(profile)
  );
  if (!persist.booking_policy_enabled || !persist.booking_policy_text) {
    return null;
  }
  return { text: persist.booking_policy_text };
}

export function publicBookingPolicyError(args: {
  ownerManualBooking: boolean;
  agreedToPolicy?: boolean;
  policyRequired: boolean;
}): string | null {
  if (args.ownerManualBooking || !args.policyRequired) return null;
  if (args.agreedToPolicy === true) return null;
  return PUBLIC_BOOKING_POLICY_REQUIRED_ERROR;
}
