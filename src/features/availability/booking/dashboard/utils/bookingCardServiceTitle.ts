/**
 * Compact service title for booking list cards.
 * Stored `service_name` may include a price-option suffix (`" — Option label"`).
 */
export function bookingCardServiceTitle(
  serviceName: string | null | undefined
): string {
  return bookingServiceNameParts(serviceName).name;
}

/** Split stored `service_name` into base name + optional price-option label. */
export function bookingServiceNameParts(
  serviceName: string | null | undefined
): { name: string; optionLabel: string | null } {
  const trimmed = (serviceName ?? '').trim();
  if (!trimmed) return { name: 'Service', optionLabel: null };

  const optionSeparator = ' — ';
  const separatorIndex = trimmed.indexOf(optionSeparator);
  if (separatorIndex > 0) {
    const name = trimmed.slice(0, separatorIndex).trim();
    const optionLabel = trimmed
      .slice(separatorIndex + optionSeparator.length)
      .trim();
    return {
      name: name || 'Service',
      optionLabel: optionLabel || null,
    };
  }

  return { name: trimmed, optionLabel: null };
}
