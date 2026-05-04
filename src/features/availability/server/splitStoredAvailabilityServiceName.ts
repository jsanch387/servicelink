const OPTION_SEPARATOR = ' — ';

/**
 * `bookings.service_name` stores either the base service name or
 * `"{base} — {optionLabel}"` (same as public checkout). Split for email payload.
 */
export function splitStoredAvailabilityServiceName(stored: string): {
  serviceName: string;
  servicePriceOptionLabel?: string;
} {
  const s = stored.trim();
  const idx = s.indexOf(OPTION_SEPARATOR);
  if (idx === -1) {
    return { serviceName: s };
  }
  return {
    serviceName: s.slice(0, idx).trim() || s,
    servicePriceOptionLabel:
      s.slice(idx + OPTION_SEPARATOR.length).trim() || undefined,
  };
}
