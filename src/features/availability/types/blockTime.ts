/**
 * Time-off block: calendar date (YYYY-MM-DD) and local times (HH:mm).
 */
export interface BlockTimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

/**
 * Shape stored in `business_availability.time_off_blocks` (JSONB array).
 */
export interface TimeOffBlockStored {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title?: string;
}

/** Normalize local wall time to HH:mm with minutes 00 or 30 only. */
export function normalizeWallClockHm(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = m[2] === '30' ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${min}`;
}

/**
 * Parses DB/API JSON into UI entries. Skips invalid items. Empty array if missing.
 */
export function parseStoredTimeOffBlocks(raw: unknown): BlockTimeEntry[] {
  if (!Array.isArray(raw)) return [];

  const out: BlockTimeEntry[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;

    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : null;
    const date = typeof o.date === 'string' ? o.date.trim() : null;
    const startRaw =
      typeof o.start_time === 'string'
        ? o.start_time
        : typeof o.startTime === 'string'
          ? o.startTime
          : null;
    const endRaw =
      typeof o.end_time === 'string'
        ? o.end_time
        : typeof o.endTime === 'string'
          ? o.endTime
          : null;

    if (!id || !date || !startRaw || !endRaw) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const startTime = normalizeWallClockHm(startRaw);
    const endTime = normalizeWallClockHm(endRaw);
    if (!startTime || !endTime) continue;

    const title = typeof o.title === 'string' ? o.title : '';

    out.push({ id, date, startTime, endTime, title });
  }

  return out;
}
