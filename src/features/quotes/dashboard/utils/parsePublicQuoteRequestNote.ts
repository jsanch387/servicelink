/**
 * Parses `quotes.request_message` (same string shape as {@link buildQuoteRequestNote}).
 */

import {
  QUOTE_REQUEST_SECOND_VEHICLE_PREFIX,
  QUOTE_REQUEST_TIMING_PREFIX,
} from '@/features/quotes/public-request/buildQuoteRequestNote';

export type ParsedPublicQuoteRequestNote = {
  preferredTiming: string | null;
  secondVehicleLine: string | null;
  /** Customer’s ask without timing / second-vehicle headers. */
  detailsOnly: string;
};

export function parsePublicQuoteRequestNote(
  note: string | null | undefined
): ParsedPublicQuoteRequestNote {
  const raw = (note ?? '').trim();
  if (!raw) {
    return { preferredTiming: null, secondVehicleLine: null, detailsOnly: '' };
  }

  const lines = raw.split(/\r?\n/);
  let preferredTiming: string | null = null;
  let secondVehicleLine: string | null = null;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith(QUOTE_REQUEST_TIMING_PREFIX) && !preferredTiming) {
      const timing = line.slice(QUOTE_REQUEST_TIMING_PREFIX.length).trim();
      preferredTiming = timing.length > 0 ? timing : null;
      index += 1;
      continue;
    }
    if (
      line.startsWith(QUOTE_REQUEST_SECOND_VEHICLE_PREFIX) &&
      !secondVehicleLine
    ) {
      const vehicle = line
        .slice(QUOTE_REQUEST_SECOND_VEHICLE_PREFIX.length)
        .trim();
      secondVehicleLine = vehicle.length > 0 ? vehicle : null;
      index += 1;
      continue;
    }
    break;
  }

  const detailsOnly = lines.slice(index).join('\n').trim();
  return { preferredTiming, secondVehicleLine, detailsOnly };
}
