import { describe, expect, it } from 'vitest';

import { addDaysToDateKey } from '../dayPlannerUtils';
import {
  addMonthsToDateKey,
  formatDayTitle,
  formatWeekTitle,
  hhmmToMinutes,
  isCursorOnToday,
  monthGridKeys,
  startOfMonthKey,
  startOfWeekKey,
  weekKeys,
} from '../calendar/dateUtils';
import {
  layoutStackedWeekEvents,
  layoutTimedEvents,
  WEEK_MORE_LINE_PX,
  WEEK_STACK_CARD_PX,
  WEEK_STACK_GAP_PX,
} from '../calendar/layoutEvents';
import { sortCalendarListEvents } from '../calendar/listPagination';
import { mapBookingsToCalendarEvents } from '../calendar/mapBookingsToEvents';
import { mapTimeOffToCalendarEvents } from '../calendar/mapTimeOffToEvents';
import type { AvailabilityBookingDisplay } from '../types';
import { shiftCalendarCursor } from '../calendar/shiftCalendarCursor';
import type { CalendarEvent } from '../calendar/types';

function event(
  id: string,
  dateKey: string,
  startMin: number,
  endMin: number
): CalendarEvent {
  return {
    id,
    dateKey,
    startMin,
    endMin,
    title: id,
    subtitle: '',
    status: 'confirmed',
    booking: null,
  };
}

describe('bookings calendar date utils', () => {
  it('starts the week on Sunday', () => {
    expect(startOfWeekKey('2026-09-16')).toBe('2026-09-13');
    expect(weekKeys('2026-09-16')).toEqual([
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
    ]);
  });

  it('builds a 6-week Sunday-start month grid', () => {
    expect(startOfMonthKey('2026-09-16')).toBe('2026-09-01');
    const grid = monthGridKeys('2026-09-16');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-08-30');
    expect(grid[41]).toBe('2026-10-10');
  });

  it('adds months without UTC drift', () => {
    expect(addMonthsToDateKey('2026-01-31', 1)).toBe('2026-02-28');
    expect(addDaysToDateKey('2026-09-30', 1)).toBe('2026-10-01');
  });

  it('knows when the cursor is already on today', () => {
    expect(isCursorOnToday('2026-09-16', 'day', '2026-09-16')).toBe(true);
    expect(isCursorOnToday('2026-09-16', 'week', '2026-09-13')).toBe(true);
    expect(isCursorOnToday('2026-09-16', 'month', '2026-09-01')).toBe(true);
    expect(isCursorOnToday('2026-08-16', 'month', '2026-09-16')).toBe(false);
  });

  it('shortens day and week titles for mobile', () => {
    expect(formatDayTitle('2026-09-16', true)).toBe('Wed, Sep 16');
    expect(formatWeekTitle('2026-09-16', true)).toBe('Sep 13 – 19');
    expect(formatWeekTitle('2026-10-01', true)).toBe('Sep 27 – Oct 3');
  });

  it('converts HH:mm to minutes', () => {
    expect(hhmmToMinutes('00:00')).toBe(0);
    expect(hhmmToMinutes('10:30')).toBe(630);
    expect(hhmmToMinutes('14:00')).toBe(840);
  });
});

describe('shiftCalendarCursor', () => {
  it('moves by day, week, or month', () => {
    expect(shiftCalendarCursor('2026-09-16', 'day', 1)).toBe('2026-09-17');
    expect(shiftCalendarCursor('2026-09-16', 'week', -1)).toBe('2026-09-09');
    expect(shiftCalendarCursor('2026-09-16', 'month', 1)).toBe('2026-10-16');
  });
});

describe('layoutTimedEvents', () => {
  it('packs overlapping jobs into adjacent columns', () => {
    const laidOut = layoutTimedEvents([
      event('a', '2026-09-16', 600, 690),
      event('b', '2026-09-16', 600, 660),
    ]);
    expect(laidOut).toHaveLength(2);
    expect(new Set(laidOut.map(item => item.col))).toEqual(new Set([0, 1]));
    expect(laidOut.every(item => item.colCount === 2)).toBe(true);
  });

  it('keeps non-overlapping jobs in a single column', () => {
    const laidOut = layoutTimedEvents([
      event('a', '2026-09-16', 540, 600),
      event('b', '2026-09-16', 600, 660),
    ]);
    expect(laidOut.every(item => item.col === 0 && item.colCount === 1)).toBe(
      true
    );
  });
});

describe('layoutStackedWeekEvents', () => {
  it('keeps jobs on their own start times', () => {
    const stacked = layoutStackedWeekEvents(
      [
        event('morning', '2026-09-16', 540, 600),
        event('afternoon', '2026-09-16', 840, 900),
      ],
      6,
      56
    );
    expect(stacked.events[0]?.topPx).toBe(((540 - 360) / 60) * 56);
    expect(stacked.events[1]?.topPx).toBe(((840 - 360) / 60) * 56);
  });

  it('shows three jobs then a text overflow like month view', () => {
    const stacked = layoutStackedWeekEvents(
      [
        event('a', '2026-09-16', 600, 690),
        event('b', '2026-09-16', 600, 660),
        event('c', '2026-09-16', 600, 700),
        event('d', '2026-09-16', 600, 680),
      ],
      6,
      104
    );
    expect(stacked.events.map(item => item.id)).toEqual(['a', 'b', 'c']);
    const cardHeight = stacked.events[0]?.heightPx ?? 0;
    expect(cardHeight).toBeGreaterThanOrEqual(22);
    expect(cardHeight).toBeLessThan(WEEK_STACK_CARD_PX);
    expect(stacked.events.every(item => item.heightPx === cardHeight)).toBe(
      true
    );
    const moreTop =
      ((600 - 360) / 60) * 104 + 3 * cardHeight + 2 * WEEK_STACK_GAP_PX;
    expect(stacked.overflows).toEqual([
      {
        id: 'week-more-2026-09-16-600',
        extra: 1,
        topPx: moreTop,
      },
    ]);
    expect(moreTop + WEEK_MORE_LINE_PX).toBeLessThanOrEqual(
      ((600 - 360) / 60) * 104 + 104
    );
  });

  it('keeps three same-start jobs without a more link', () => {
    const stacked = layoutStackedWeekEvents(
      [
        event('a', '2026-09-16', 600, 690),
        event('b', '2026-09-16', 600, 660),
        event('c', '2026-09-16', 600, 700),
      ],
      6,
      104
    );
    expect(stacked.events.map(item => item.id)).toEqual(['a', 'b', 'c']);
    expect(
      stacked.events.every(item => item.heightPx === WEEK_STACK_CARD_PX)
    ).toBe(true);
    expect(stacked.overflows).toEqual([]);
  });

  it('clips all-day blocks to the visible week hours', () => {
    const stacked = layoutStackedWeekEvents(
      [event('all-day', '2026-09-16', 0, 1439)],
      6,
      104
    );
    expect(stacked.events[0]?.topPx).toBe(0);
    expect(stacked.events[0]?.heightPx).toBe(16 * 104);
    expect(stacked.overflows).toEqual([]);
  });
});

describe('mapBookingsToCalendarEvents', () => {
  it('maps a shop booking onto the calendar grid', () => {
    const booking = {
      id: 'bk-db-1',
      customerName: 'Sam Patel',
      serviceName: 'Full Detail',
      serviceDurationMinutes: 90,
      date: '2026-09-16',
      startTimeHHmm: '14:00',
      status: 'confirmed',
      jobs: [],
      addonDetails: [],
    } as AvailabilityBookingDisplay;

    expect(mapBookingsToCalendarEvents([booking])).toEqual([
      {
        id: 'bk-db-1',
        dateKey: '2026-09-16',
        startMin: 840,
        endMin: 930,
        title: 'Sam Patel',
        subtitle: 'Full Detail',
        status: 'confirmed',
        assigneeLabel: null,
        booking,
      },
    ]);
  });

  it('adds a short assignee name when the shop has teammates', () => {
    const booking = {
      id: 'bk-db-2',
      customerName: 'Sam Patel',
      serviceName: 'Full Detail',
      serviceDurationMinutes: 90,
      date: '2026-09-16',
      startTimeHHmm: '14:00',
      status: 'confirmed',
      assignedUserId: 'worker-1',
      jobs: [],
      addonDetails: [],
    } as AvailabilityBookingDisplay;

    const events = mapBookingsToCalendarEvents(
      [booking],
      [
        {
          userId: 'owner-1',
          label: 'jesus@shop.com (owner)',
          kind: 'owner',
        },
        {
          userId: 'worker-1',
          label: 'jose@shop.com',
          kind: 'member',
        },
      ]
    );

    expect(events[0]?.assigneeLabel).toBe('Jose');
  });
});

describe('mapTimeOffToCalendarEvents', () => {
  it('expands a time-off block onto the days it covers', () => {
    const events = mapTimeOffToCalendarEvents(
      [
        {
          id: 'off-1',
          startDate: '2026-09-16',
          endDate: '2026-09-17',
          allDay: false,
          startTime: '12:00',
          endTime: '14:00',
          title: 'Lunch block',
        },
      ],
      ['2026-09-15', '2026-09-16', '2026-09-17']
    );

    expect(events.map(item => item.dateKey)).toEqual([
      '2026-09-16',
      '2026-09-17',
    ]);
    expect(events[0]).toMatchObject({
      startMin: 720,
      endMin: 840,
      title: 'Lunch block',
      kind: 'timeOff',
      booking: null,
    });
  });
});

describe('calendar list pagination', () => {
  it('sorts newest date and later start first', () => {
    const sorted = sortCalendarListEvents([
      event('old-morning', '2026-09-01', 540, 600),
      event('new-morning', '2026-09-14', 540, 600),
      event('new-afternoon', '2026-09-14', 840, 900),
    ]);
    expect(sorted.map(item => item.id)).toEqual([
      'new-afternoon',
      'new-morning',
      'old-morning',
    ]);
  });

  it('sorts upcoming soonest first', () => {
    const sorted = sortCalendarListEvents(
      [
        event('old-morning', '2026-09-01', 540, 600),
        event('new-morning', '2026-09-14', 540, 600),
        event('new-afternoon', '2026-09-14', 840, 900),
      ],
      'asc'
    );
    expect(sorted.map(item => item.id)).toEqual([
      'old-morning',
      'new-morning',
      'new-afternoon',
    ]);
  });
});
