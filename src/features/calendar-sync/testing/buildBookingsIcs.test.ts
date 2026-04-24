import type { CalendarFeedBookingRow } from '../services/listBookingsForCalendarFeed';
import { describe, expect, it } from 'vitest';
import {
  buildBookingsIcs,
  escapeIcsText,
  foldIcsLine,
  formatBookingLocation,
} from '../server/buildBookingsIcs';

function row(
  overrides: Partial<CalendarFeedBookingRow>
): CalendarFeedBookingRow {
  return {
    id: 'x',
    service_name: 'S',
    scheduled_date: '2026-01-01',
    start_time: '10:00:00',
    duration_minutes: 60,
    customer_name: 'N',
    customer_phone: null,
    customer_street_address: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
    customer_notes: null,
    status: 'confirmed',
    ...overrides,
  };
}

describe('escapeIcsText', () => {
  it('escapes special characters', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('formatBookingLocation', () => {
  it('formats street with city, state zip using commas', () => {
    expect(
      formatBookingLocation(
        row({
          customer_street_address: '123 Main St',
          customer_city: 'Miami',
          customer_state: 'FL',
          customer_zip: '78660',
        })
      )
    ).toBe('123 Main St, Miami, FL 78660');
  });

  it('omits empty parts', () => {
    expect(formatBookingLocation(row({ customer_city: 'Austin' }))).toBe(
      'Austin'
    );
  });
});

describe('foldIcsLine', () => {
  it('returns short lines unchanged', () => {
    expect(foldIcsLine('SUMMARY:Short')).toBe('SUMMARY:Short');
  });

  it('folds long lines', () => {
    const long = 'A'.repeat(80);
    const folded = foldIcsLine(long);
    expect(folded).toContain('\r\n');
    expect(folded.replace(/\r\n ?/g, '')).toBe(long);
  });
});

describe('buildBookingsIcs', () => {
  it('includes a confirmed VEVENT with UID, times, and summary', () => {
    const ics = buildBookingsIcs(
      [
        row({
          id: '11111111-1111-1111-1111-111111111111',
          service_name: 'House cleaning',
          scheduled_date: '2026-06-15',
          start_time: '14:30:00',
          duration_minutes: 90,
        }),
      ],
      { businessName: 'Acme', calendarDomain: 'app.example.com' }
    );
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('METHOD:PUBLISH');
    expect(ics).toContain(
      'UID:booking-11111111-1111-1111-1111-111111111111@app.example.com'
    );
    expect(ics).toContain('SUMMARY:House cleaning');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('DTSTART:20260615T143000');
    expect(ics).toContain('DTEND:20260615T160000');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('escapes commas in LOCATION', () => {
    const ics = buildBookingsIcs(
      [
        row({
          id: '11111111-1111-1111-1111-111111111111',
          customer_street_address: '1 Main',
          customer_city: 'Miami',
          customer_state: 'FL',
          customer_zip: '33101',
        }),
      ],
      { businessName: 'Acme', calendarDomain: 'example.com' }
    );
    expect(ics).toContain(String.raw`LOCATION:1 Main\, Miami\, FL 33101`);
  });

  it('emits CANCELLED for cancelled rows', () => {
    const ics = buildBookingsIcs(
      [
        row({
          id: '22222222-2222-2222-2222-222222222222',
          status: 'cancelled',
          scheduled_date: '2026-07-01',
          start_time: '09:00:00',
          duration_minutes: 60,
        }),
      ],
      { businessName: 'Acme', calendarDomain: 'example.com' }
    );
    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain(
      'UID:booking-22222222-2222-2222-2222-222222222222@example.com'
    );
  });
});
