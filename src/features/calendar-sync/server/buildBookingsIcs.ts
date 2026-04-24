import type { CalendarFeedBookingRow } from '../services/listBookingsForCalendarFeed';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ICS TEXT escaping (RFC 5545). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\r/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** UTC stamp like `20250423T153045Z`. */
function formatUtcStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/** Floating local `YYYYMMDDTHHmmss` (no Z) from UTC-math wall components. */
function formatFloatingDateTimeUtcParts(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number
): string {
  return `${String(y)}${pad2(mo)}${pad2(d)}T${pad2(h)}${pad2(mi)}${pad2(s)}`;
}

function parseWallStart(dateStr: string, timeStr: string): Date {
  const [Y, M, D] = dateStr.split('-').map(n => parseInt(n, 10));
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const mi = parseInt(parts[1] ?? '0', 10);
  const s = parseInt(parts[2] ?? '0', 10) || 0;
  return new Date(Date.UTC(Y, M - 1, D, h, mi, s));
}

function formatFloatingEnd(
  dateStr: string,
  timeStr: string,
  durationMinutes: number
): string {
  const start = parseWallStart(dateStr, timeStr);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return formatFloatingDateTimeUtcParts(
    end.getUTCFullYear(),
    end.getUTCMonth() + 1,
    end.getUTCDate(),
    end.getUTCHours(),
    end.getUTCMinutes(),
    end.getUTCSeconds()
  );
}

function formatFloatingStart(dateStr: string, timeStr: string): string {
  const d = parseWallStart(dateStr, timeStr);
  return formatFloatingDateTimeUtcParts(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );
}

/** Single-line US-style address for ICS LOCATION (commas; escaped later). */
export function formatBookingLocation(row: CalendarFeedBookingRow): string {
  const street = (row.customer_street_address ?? '').trim();
  const city = (row.customer_city ?? '').trim();
  const state = (row.customer_state ?? '').trim();
  const zip = (row.customer_zip ?? '').trim();

  const segments: string[] = [];
  if (street) segments.push(street);

  let cityStateZip = '';
  if (city && state) {
    cityStateZip = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
  } else if (city) {
    cityStateZip = zip ? `${city} ${zip}` : city;
  } else if (state) {
    cityStateZip = zip ? `${state} ${zip}` : state;
  } else if (zip) {
    cityStateZip = zip;
  }

  if (cityStateZip) segments.push(cityStateZip);
  return segments.join(', ');
}

function buildDescription(row: CalendarFeedBookingRow): string {
  const lines = [
    `Customer: ${row.customer_name}`,
    row.customer_phone ? `Phone: ${row.customer_phone}` : '',
    row.customer_notes?.trim() ? `Notes: ${row.customer_notes.trim()}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Fold long lines per RFC 5545 (75 octets; continuation starts with space). */
export function foldIcsLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const out: string[] = [];
  let rest = line;
  while (rest.length > max) {
    out.push(rest.slice(0, max));
    rest = ` ${rest.slice(max)}`;
  }
  if (rest.length) out.push(rest);
  return out.join('\r\n');
}

export interface BuildBookingsIcsOptions {
  businessName: string;
  /** Used in UID host part, e.g. `example.com`. */
  calendarDomain: string;
}

export function buildBookingsIcs(
  rows: CalendarFeedBookingRow[],
  options: BuildBookingsIcsOptions
): string {
  const safeDomain =
    options.calendarDomain.replace(/[^a-zA-Z0-9.-]/g, '') || 'calendar';
  const calName = escapeIcsText(
    `Bookings — ${options.businessName}`.slice(0, 200)
  );
  const now = new Date();
  const dtStamp = formatUtcStamp(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ServiceLink//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
  ];

  for (const row of rows) {
    const uid = `booking-${row.id}@${safeDomain}`;
    const summary = escapeIcsText(row.service_name || 'Booking');
    const location = escapeIcsText(formatBookingLocation(row));
    const description = escapeIcsText(buildDescription(row));
    const dtStart = formatFloatingStart(row.scheduled_date, row.start_time);
    const dtEnd = formatFloatingEnd(
      row.scheduled_date,
      row.start_time,
      Math.max(1, row.duration_minutes || 60)
    );

    if (row.status === 'cancelled') {
      const dtStart = formatFloatingStart(row.scheduled_date, row.start_time);
      const dtEnd = formatFloatingEnd(
        row.scheduled_date,
        row.start_time,
        Math.max(1, row.duration_minutes || 60)
      );
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        'STATUS:CANCELLED',
        'SEQUENCE:1',
        'END:VEVENT'
      );
      continue;
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : '',
      description ? `DESCRIPTION:${description}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return lines
    .filter(Boolean)
    .map(l => foldIcsLine(l))
    .join('\r\n');
}
