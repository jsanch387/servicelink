/**
 * Buffer time (`buffer_time`) helpers for slot filtering and booking validation.
 * Buffer is the required gap between two appointments — not lead time.
 */

import { isBufferTimeValue, type BufferTimeValue } from '../types/availability';

const BUFFER_TO_MINUTES: Record<BufferTimeValue, number> = {
  none: 0,
  '15m': 15,
  '30m': 30,
  '45m': 45,
  '1h': 60,
  '90m': 90,
  '2h': 120,
};

/** Minutes of gap required between appointments; unknown/invalid values → 0. */
export function bufferTimeToMinutes(value: string | null | undefined): number {
  if (!value || !isBufferTimeValue(value)) return 0;
  return BUFFER_TO_MINUTES[value];
}

/** Canonical stored value; missing/invalid → `'none'`. */
export function resolveBufferTimeValue(
  value: string | null | undefined
): BufferTimeValue {
  if (!value || !isBufferTimeValue(value)) return 'none';
  return value;
}
