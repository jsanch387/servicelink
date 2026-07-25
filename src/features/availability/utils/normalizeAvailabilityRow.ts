/**
 * Normalizes a `business_availability` row for API responses / UI load.
 * - Validates `minimum_notice` against the expanded lead-time set
 * - Rewrites `time_off_blocks` to the canonical range + all-day shape
 *   (legacy single-`date` blocks still accepted on read)
 */

import {
  isMinimumNoticeValue,
  type BusinessAvailabilityRow,
} from '../types/availability';
import {
  parseStoredTimeOffBlocks,
  toStoredTimeOffBlock,
  type TimeOffBlockStored,
} from '../types/blockTime';

export function normalizeAvailabilityRow(
  row: BusinessAvailabilityRow
): BusinessAvailabilityRow {
  const time_off_blocks: TimeOffBlockStored[] = parseStoredTimeOffBlocks(
    row.time_off_blocks
  ).map(toStoredTimeOffBlock);

  return {
    ...row,
    minimum_notice: isMinimumNoticeValue(row.minimum_notice)
      ? row.minimum_notice
      : 'none',
    time_off_blocks,
  };
}
