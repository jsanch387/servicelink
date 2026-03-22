/**
 * Validates `timeOffBlocks` from POST /api/availability (camelCase client payload).
 * Used only on the server; returns JSONB-ready rows (snake_case).
 */

import {
  normalizeWallClockHm,
  type TimeOffBlockStored,
} from '../types/blockTime';
import { compareTime } from './timeOptions';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ENTRIES = 200;
const MAX_ID_LEN = 80;
const MAX_TITLE_LEN = 500;

export type ParseTimeOffBlocksResult =
  | { ok: true; value: TimeOffBlockStored[] }
  | { ok: false; error: string };

/**
 * Parses and validates the request body field (array or undefined).
 * Empty array if omitted or null.
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

    const date = typeof o.date === 'string' ? o.date.trim() : '';
    if (!date || !ISO_DATE.test(date)) {
      return { ok: false, error: 'Invalid date on a time-off block' };
    }

    const startRaw =
      typeof o.startTime === 'string'
        ? o.startTime
        : typeof o.start_time === 'string'
          ? o.start_time
          : '';
    const endRaw =
      typeof o.endTime === 'string'
        ? o.endTime
        : typeof o.end_time === 'string'
          ? o.end_time
          : '';

    const start_time = normalizeWallClockHm(startRaw);
    const end_time = normalizeWallClockHm(endRaw);
    if (!start_time || !end_time) {
      return {
        ok: false,
        error: 'Invalid start or end time on a time-off block',
      };
    }
    if (compareTime(end_time, start_time) <= 0) {
      return {
        ok: false,
        error: 'Each time-off block must end after it starts',
      };
    }

    let title = typeof o.title === 'string' ? o.title : '';
    if (title.length > MAX_TITLE_LEN) {
      title = title.slice(0, MAX_TITLE_LEN);
    }

    const row: TimeOffBlockStored = {
      id: idRaw,
      date,
      start_time,
      end_time,
    };
    if (title.trim()) {
      row.title = title.trim();
    }
    value.push(row);
  }

  return { ok: true, value };
}
