/**
 * Compact service title for booking list cards.
 * Stored `service_name` may include a price-option suffix (`" — Option label"`)
 * and multi-job summary (`"Name — Opt + 1 more"`).
 */

import type { AvailabilityBookingDisplay } from '../types';

export function bookingCardServiceTitle(
  serviceName: string | null | undefined
): string {
  const trimmed = (serviceName ?? '').trim();
  if (!trimmed) return 'Service';

  // Preserve multi-job list summary: "First — Opt + 2 more" → "First + 2 more"
  const moreMatch = trimmed.match(/^(.*) \+ (\d+) more$/);
  if (moreMatch) {
    const head = moreMatch[1]?.trim() ?? '';
    const moreCount = moreMatch[2];
    const base = bookingServiceNameParts(head).name;
    return `${base} + ${moreCount} more`;
  }

  return bookingServiceNameParts(trimmed).name;
}

/**
 * List/calendar title: prefer live `jobs[]` when present so "+ N more" is correct.
 */
export function bookingListServiceTitle(
  booking: Pick<AvailabilityBookingDisplay, 'serviceName' | 'jobs'>
): string {
  const jobs = booking.jobs ?? [];
  if (jobs.length > 1) {
    const first = jobs[0]?.serviceName?.trim() || 'Service';
    return `${first} + ${jobs.length - 1} more`;
  }
  return bookingCardServiceTitle(booking.serviceName);
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
