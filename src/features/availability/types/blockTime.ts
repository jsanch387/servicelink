/**
 * Time-off blocks on `business_availability.time_off_blocks`.
 * Canonical shape supports date ranges + all-day; legacy single-`date` still reads.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** UI / client state for one time-off block. */
export interface BlockTimeEntry {
  id: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  title: string;
}

/**
 * Shape stored in `business_availability.time_off_blocks` (JSONB array).
 * Always write canonical fields; may also include legacy `date` (= start_date).
 */
export interface TimeOffBlockStored {
  id: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string;
  end_time: string;
  /** Legacy single-day field; kept equal to `start_date` for older readers. */
  date?: string;
  title?: string;
}

/** Normalize HH:mm allowing any minute (needed for all-day `23:59`). */
export function normalizeTimeOffHm(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Normalize local wall time to HH:mm with minutes 00 or 30 only.
 * Used for booking display / working-hours style times.
 */
export function normalizeWallClockHm(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = m[2] === '30' ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${min}`;
}

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

/** Inclusive: `startDate <= day <= endDate` (lexicographic works for YYYY-MM-DD). */
export function dateInTimeOffRange(
  dayYmd: string,
  startDate: string,
  endDate: string
): boolean {
  return dayYmd >= startDate && dayYmd <= endDate;
}

export function blockCoversDate(
  block: Pick<BlockTimeEntry, 'startDate' | 'endDate'>,
  dayYmd: string
): boolean {
  return dateInTimeOffRange(dayYmd, block.startDate, block.endDate);
}

/** Canonical all-day times stored in JSONB. */
export const ALL_DAY_START = '00:00';
export const ALL_DAY_END = '23:59';

export function normalizeBlockTimeEntry(
  partial: Omit<BlockTimeEntry, 'id'> & { id?: string }
): Omit<BlockTimeEntry, 'id'> {
  const startDate = partial.startDate.trim();
  const endDate = partial.endDate.trim() || startDate;
  const allDay = Boolean(partial.allDay);
  return {
    startDate,
    endDate: endDate >= startDate ? endDate : startDate,
    allDay,
    startTime: allDay ? ALL_DAY_START : partial.startTime,
    endTime: allDay ? ALL_DAY_END : partial.endTime,
    title: (partial.title ?? '').trim(),
  };
}

export function toStoredTimeOffBlock(
  entry: BlockTimeEntry
): TimeOffBlockStored {
  const normalized = normalizeBlockTimeEntry(entry);
  const row: TimeOffBlockStored = {
    id: entry.id,
    start_date: normalized.startDate,
    end_date: normalized.endDate,
    all_day: normalized.allDay,
    start_time: normalized.startTime,
    end_time: normalized.endTime,
    date: normalized.startDate,
  };
  if (normalized.title) {
    row.title = normalized.title;
  }
  return row;
}

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
 * Parses DB/API JSON into UI entries. Skips invalid items. Empty array if missing.
 * Supports canonical ranges and legacy `{ date, start_time, end_time }`.
 */
export function parseStoredTimeOffBlocks(raw: unknown): BlockTimeEntry[] {
  if (!Array.isArray(raw)) return [];

  const out: BlockTimeEntry[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;

    const id = readString(o, 'id');
    if (!id) continue;

    const legacyDate = readString(o, 'date');
    const startDate = readString(o, 'start_date', 'startDate') ?? legacyDate;
    const endDate =
      readString(o, 'end_date', 'endDate') ?? startDate ?? legacyDate;
    if (!startDate || !endDate) continue;
    if (!isIsoDate(startDate) || !isIsoDate(endDate)) continue;

    const startRaw = readString(o, 'start_time', 'startTime');
    const endRaw = readString(o, 'end_time', 'endTime');
    if (!startRaw || !endRaw) continue;

    const startTime = normalizeTimeOffHm(startRaw);
    const endTime = normalizeTimeOffHm(endRaw);
    if (!startTime || !endTime) continue;

    const allDayExplicit = o.all_day ?? o.allDay;
    const allDay =
      typeof allDayExplicit === 'boolean'
        ? allDayExplicit
        : startTime === ALL_DAY_START && endTime === ALL_DAY_END;

    const title = typeof o.title === 'string' ? o.title : '';

    out.push({
      id,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      allDay,
      startTime: allDay ? ALL_DAY_START : startTime,
      endTime: allDay ? ALL_DAY_END : endTime,
      title,
    });
  }

  return out;
}

/** Map UI entry → booking overlap interval fields. */
export function toTimeOffIntervalFields(entry: BlockTimeEntry): {
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
} {
  return {
    startDate: entry.startDate,
    endDate: entry.endDate,
    allDay: entry.allDay,
    startTime: entry.startTime,
    endTime: entry.endTime,
  };
}
