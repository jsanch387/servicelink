/** Browser IANA timezone for lead-time checks on the public booking API. */
export function clientBookingTimeZone(): string | undefined {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone?.trim() || undefined;
  } catch {
    return undefined;
  }
}
