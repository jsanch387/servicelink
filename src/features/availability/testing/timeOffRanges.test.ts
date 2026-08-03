import { describe, expect, it } from 'vitest';
import {
  bookingOverlapsTimeOff,
  generateTimeSlots,
} from '../booking/utils/slotGeneration';
import {
  parseStoredTimeOffBlocks,
  toTimeOffIntervalFields,
} from '../types/blockTime';
import { DEFAULT_SCHEDULE } from '../types/availability';
import { parseTimeOffBlocksFromRequestBody } from '../utils/timeOffBlocksPayload';

describe('time off ranges', () => {
  it('parses legacy single-day blocks', () => {
    const parsed = parseStoredTimeOffBlocks([
      {
        id: 'a',
        date: '2026-07-24',
        start_time: '09:00',
        end_time: '12:00',
        title: 'Doctor',
      },
    ]);
    expect(parsed).toEqual([
      {
        id: 'a',
        startDate: '2026-07-24',
        endDate: '2026-07-24',
        allDay: false,
        startTime: '09:00',
        endTime: '12:00',
        title: 'Doctor',
      },
    ]);
  });

  it('parses canonical multi-day all-day blocks', () => {
    const parsed = parseStoredTimeOffBlocks([
      {
        id: 'b',
        start_date: '2026-07-24',
        end_date: '2026-07-27',
        all_day: true,
        start_time: '00:00',
        end_time: '23:59',
        date: '2026-07-24',
        title: 'Vacation',
      },
    ]);
    expect(parsed[0]).toMatchObject({
      startDate: '2026-07-24',
      endDate: '2026-07-27',
      allDay: true,
      title: 'Vacation',
    });
  });

  it('normalizes request body to canonical stored shape', () => {
    const result = parseTimeOffBlocksFromRequestBody([
      {
        id: 'c',
        startDate: '2026-07-24',
        endDate: '2026-07-26',
        allDay: true,
        startTime: '09:00',
        endTime: '10:00',
        title: 'Out',
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({
      id: 'c',
      start_date: '2026-07-24',
      end_date: '2026-07-26',
      all_day: true,
      start_time: '00:00',
      end_time: '23:59',
      date: '2026-07-24',
      title: 'Out',
    });
  });

  it('blocks every day in an all-day range', () => {
    const blocks = [
      toTimeOffIntervalFields({
        id: 'd',
        startDate: '2026-07-24',
        endDate: '2026-07-26',
        allDay: true,
        startTime: '00:00',
        endTime: '23:59',
        title: '',
      }),
    ];
    expect(bookingOverlapsTimeOff('2026-07-24', '10:00', 60, blocks)).toBe(
      true
    );
    expect(bookingOverlapsTimeOff('2026-07-25', '10:00', 60, blocks)).toBe(
      true
    );
    expect(bookingOverlapsTimeOff('2026-07-26', '10:00', 60, blocks)).toBe(
      true
    );
    expect(bookingOverlapsTimeOff('2026-07-27', '10:00', 60, blocks)).toBe(
      false
    );
  });

  it('applies the same timed window on each day in the range', () => {
    const blocks = [
      toTimeOffIntervalFields({
        id: 'e',
        startDate: '2026-07-24',
        endDate: '2026-07-25',
        allDay: false,
        startTime: '09:00',
        endTime: '12:00',
        title: '',
      }),
    ];
    expect(bookingOverlapsTimeOff('2026-07-24', '10:00', 60, blocks)).toBe(
      true
    );
    expect(bookingOverlapsTimeOff('2026-07-24', '13:00', 60, blocks)).toBe(
      false
    );
    expect(bookingOverlapsTimeOff('2026-07-25', '11:00', 30, blocks)).toBe(
      true
    );
  });

  it('generateTimeSlots hides all slots on an all-day day', () => {
    // Friday 2026-07-24
    const day = new Date(2026, 6, 24);
    const now = new Date(2026, 6, 24, 8, 0, 0);
    const blocks = [
      toTimeOffIntervalFields({
        id: 'f',
        startDate: '2026-07-24',
        endDate: '2026-07-24',
        allDay: true,
        startTime: '00:00',
        endTime: '23:59',
        title: '',
      }),
    ];
    expect(
      generateTimeSlots(day, DEFAULT_SCHEDULE, 60, [], 30, blocks, 'none', now)
    ).toEqual([]);
  });

  it('generateTimeSlots hides only overlapping timed slots', () => {
    const day = new Date(2026, 6, 24);
    const now = new Date(2026, 6, 24, 8, 0, 0);
    const blocks = [
      toTimeOffIntervalFields({
        id: 'g',
        startDate: '2026-07-24',
        endDate: '2026-07-24',
        allDay: false,
        startTime: '09:00',
        endTime: '12:00',
        title: '',
      }),
    ];
    const slots = generateTimeSlots(
      day,
      DEFAULT_SCHEDULE,
      60,
      [],
      30,
      blocks,
      'none',
      now
    );
    expect(slots).not.toContain('09:00');
    expect(slots).not.toContain('11:00');
    expect(slots).toContain('12:00');
    expect(slots).toContain('16:00');
  });

  it('generateTimeSlots applies multi-day all-day ranges', () => {
    const saturday = new Date(2026, 6, 25);
    const monday = new Date(2026, 6, 27);
    const now = new Date(2026, 6, 20, 8, 0, 0);
    const blocks = [
      toTimeOffIntervalFields({
        id: 'h',
        startDate: '2026-07-24',
        endDate: '2026-07-27',
        allDay: true,
        startTime: '00:00',
        endTime: '23:59',
        title: '',
      }),
    ];
    expect(
      generateTimeSlots(
        saturday,
        DEFAULT_SCHEDULE,
        60,
        [],
        30,
        blocks,
        'none',
        now
      )
    ).toEqual([]);
    expect(
      generateTimeSlots(
        monday,
        DEFAULT_SCHEDULE,
        60,
        [],
        30,
        blocks,
        'none',
        now
      )
    ).toEqual([]);
    expect(
      generateTimeSlots(
        new Date(2026, 6, 28),
        DEFAULT_SCHEDULE,
        60,
        [],
        30,
        blocks,
        'none',
        now
      ).length
    ).toBeGreaterThan(0);
  });
});
