/**
 * Validates `timeOffBlocks` from POST /api/availability (camelCase client payload).
 * Used only on the server; returns JSONB-ready rows (snake_case canonical).
 */

import {
  ALL_DAY_END,
  ALL_DAY_START,
  isIsoDate,
  normalizeTimeOffHm,
  toStoredTimeOffBlock,
  type BlockTimeEntry,
  type TimeOffBlockStored,
} from '../types/blockTime';
import { compareTime } from './timeOptions';

const MAX_ENTRIES = 200;
const MAX_ID_LEN = 80;
const MAX_TITLE_LEN = 500;

export type ParseTimeOffBlocksResult =
  | { ok: true; value: TimeOffBlockStored[] }
  | { ok: false; error: string };

function readString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Parses and validates the request body field (array or undefined).
 * Empty array if omitted or null.
 * Accepts canonical range fields and legacy `{ date, startTime, endTime }`.
 */
export function parseTimeOffBlocksFromRequestBody(
  raw: unknown
): ParseTimeOffBlocksResult {
  if (raw === undefined || raw === null) {
    return { ok: true, value: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'timeOffBlocks must be an array' };
  }
  if (raw.length > MAX_ENTRIES) {
    return { ok: false, error: 'Too many time-off entries' };
  }

  const value: TimeOffBlockStored[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Invalid time-off entry at index ${i}` };
    }
    const o = item as Record<string, unknown>;

    const idRaw = typeof o.id === 'string' ? o.id.trim() : '';
    if (!idRaw || idRaw.length > MAX_ID_LEN) {
      return { ok: false, error: 'Each time-off block needs a valid id' };
    }

    const legacyDate = readString(o, 'date');
    const startDate =
      readString(o, 'startDate', 'start_date') ?? legacyDate ?? '';
    const endDate =
      readString(o, 'endDate', 'end_date') ?? startDate ?? legacyDate ?? '';

    if (
      !startDate ||
      !isIsoDate(startDate) ||
      !endDate ||
      !isIsoDate(endDate)
    ) {
      return { ok: false, error: 'Invalid date on a time-off block' };
    }
    if (endDate < startDate) {
      return {
        ok: false,
        error: 'Each time-off block must end on or after its start date',
      };
    }

    const allDayRaw = o.allDay ?? o.all_day;
    const allDay = typeof allDayRaw === 'boolean' ? allDayRaw : false;

    let start_time: string;
    let end_time: string;
    if (allDay) {
      start_time = ALL_DAY_START;
      end_time = ALL_DAY_END;
    } else {
      const startRaw = readString(o, 'startTime', 'start_time') ?? '';
      const endRaw = readString(o, 'endTime', 'end_time') ?? '';
      const normalizedStart = normalizeTimeOffHm(startRaw);
      const normalizedEnd = normalizeTimeOffHm(endRaw);
      if (!normalizedStart || !normalizedEnd) {
        return {
          ok: false,
          error: 'Invalid start or end time on a time-off block',
        };
      }
      if (compareTime(normalizedEnd, normalizedStart) <= 0) {
        return {
          ok: false,
          error: 'Each time-off block must end after it starts',
        };
      }
      start_time = normalizedStart;
      end_time = normalizedEnd;
    }

    let title = typeof o.title === 'string' ? o.title : '';
    if (title.length > MAX_TITLE_LEN) {
      title = title.slice(0, MAX_TITLE_LEN);
    }

    const entry: BlockTimeEntry = {
      id: idRaw,
      startDate,
      endDate,
      allDay,
      startTime: start_time,
      endTime: end_time,
      title: title.trim(),
    };
    value.push(toStoredTimeOffBlock(entry));
  }

  return { ok: true, value };
}
