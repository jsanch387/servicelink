/**
 * Compact service title for booking list cards.
 * Stored `service_name` may include a price-option suffix (`" — Option label"`).
 */
export function bookingCardServiceTitle(
  serviceName: string | null | undefined
): string {
  const trimmed = (serviceName ?? '').trim();
  if (!trimmed) return 'Service';

  const optionSeparator = ' — ';
  const separatorIndex = trimmed.indexOf(optionSeparator);
  if (separatorIndex > 0) {
    return trimmed.slice(0, separatorIndex).trim();
  }

  return trimmed;
}
