import { describe, expect, it } from 'vitest';

import {
  bookingListKeysetOr,
  encodeBookingListCursor,
  parseBookingListCursor,
} from '../utils/bookingListCursor';

describe('bookingListCursor', () => {
  it('round-trips a newest-first keyset cursor', () => {
    const cursor = {
      scheduledDate: '2026-09-14',
      startTime: '14:00:00',
      id: '11111111-1111-1111-1111-111111111111',
    };
    expect(parseBookingListCursor(encodeBookingListCursor(cursor))).toEqual(
      cursor
    );
  });

  it('rejects a malformed cursor', () => {
    expect(parseBookingListCursor('not-a-cursor')).toBeNull();
    expect(parseBookingListCursor('2026-09-14|bad|id')).toBeNull();
  });

  it('builds a quoted PostgREST keyset filter', () => {
    expect(
      bookingListKeysetOr({
        scheduledDate: '2026-09-14',
        startTime: '14:00:00',
        id: '11111111-1111-1111-1111-111111111111',
      })
    ).toBe(
      'scheduled_date.lt.2026-09-14,and(scheduled_date.eq.2026-09-14,start_time.lt."14:00:00"),and(scheduled_date.eq.2026-09-14,start_time.eq."14:00:00",id.lt."11111111-1111-1111-1111-111111111111")'
    );
  });

  it('flips the keyset comparison for upcoming pages', () => {
    expect(
      bookingListKeysetOr(
        {
          scheduledDate: '2026-09-14',
          startTime: '14:00:00',
          id: '11111111-1111-1111-1111-111111111111',
        },
        'asc'
      )
    ).toBe(
      'scheduled_date.gt.2026-09-14,and(scheduled_date.eq.2026-09-14,start_time.gt."14:00:00"),and(scheduled_date.eq.2026-09-14,start_time.eq."14:00:00",id.gt."11111111-1111-1111-1111-111111111111")'
    );
  });
});
