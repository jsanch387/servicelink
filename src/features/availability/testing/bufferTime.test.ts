import { describe, expect, it } from 'vitest';
import {
  bookingOverlapsExistingBookings,
  findEarliestAvailableSlot,
  generateTimeSlots,
} from '../booking/utils/slotGeneration';
import { DEFAULT_SCHEDULE } from '../types/availability';
import {
  bufferTimeToMinutes,
  resolveBufferTimeValue,
} from '../utils/bufferTime';

const OPEN_DAY = new Date(2026, 6, 24); // Friday
const NOW_BEFORE_OPEN = new Date(2026, 6, 24, 7, 0, 0);
const EXISTING_8AM_90MIN = {
  date: '2026-07-24',
  startTime: '08:00',
  durationMinutes: 90,
};

describe('buffer time', () => {
  it('maps stored values to minutes', () => {
    expect(bufferTimeToMinutes('none')).toBe(0);
    expect(bufferTimeToMinutes('15m')).toBe(15);
    expect(bufferTimeToMinutes('30m')).toBe(30);
    expect(bufferTimeToMinutes('45m')).toBe(45);
    expect(bufferTimeToMinutes('1h')).toBe(60);
    expect(bufferTimeToMinutes('90m')).toBe(90);
    expect(bufferTimeToMinutes('2h')).toBe(120);
  });

  it('treats unknown or missing values as no buffer', () => {
    expect(bufferTimeToMinutes(undefined)).toBe(0);
    expect(bufferTimeToMinutes(null)).toBe(0);
    expect(bufferTimeToMinutes('garbage')).toBe(0);
    expect(resolveBufferTimeValue(undefined)).toBe('none');
    expect(resolveBufferTimeValue('not-a-value')).toBe('none');
    expect(resolveBufferTimeValue('30m')).toBe('30m');
  });

  it('does nothing when the day has no existing bookings', () => {
    const slots = generateTimeSlots(
      OPEN_DAY,
      {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      90,
      [],
      30,
      [],
      'none',
      { now: NOW_BEFORE_OPEN, bufferTime: '1h' }
    );
    expect(slots[0]).toBe('08:00');
    expect(slots).toContain('10:00');
  });

  it('with no buffer, allows a 10:00 start after an 8:00–9:30 job', () => {
    const slots = generateTimeSlots(
      OPEN_DAY,
      {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      90,
      [EXISTING_8AM_90MIN],
      30,
      [],
      'none',
      { now: NOW_BEFORE_OPEN, bufferTime: 'none' }
    );
    expect(slots).not.toContain('08:00');
    expect(slots).not.toContain('08:30');
    expect(slots).toContain('09:30');
    expect(slots).toContain('10:00');
  });

  it('with a 30-minute buffer, first slot after 8:00–9:30 is 10:00', () => {
    const slots = generateTimeSlots(
      OPEN_DAY,
      {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      90,
      [EXISTING_8AM_90MIN],
      30,
      [],
      'none',
      { now: NOW_BEFORE_OPEN, bufferTime: '30m' }
    );
    expect(slots).not.toContain('09:30');
    expect(slots[0]).toBe('10:00');
  });

  it('with a 1-hour buffer, 10:00 is blocked after an 8:00–9:30 job', () => {
    const slots = generateTimeSlots(
      OPEN_DAY,
      {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      90,
      [EXISTING_8AM_90MIN],
      30,
      [],
      'none',
      { now: NOW_BEFORE_OPEN, bufferTime: '1h' }
    );
    expect(slots).not.toContain('10:00');
    expect(slots[0]).toBe('10:30');
  });

  it('applies the gap before an existing booking too', () => {
    const laterJob = {
      date: '2026-07-24',
      startTime: '14:00',
      durationMinutes: 90,
    };
    const slots = generateTimeSlots(
      OPEN_DAY,
      {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      90,
      [laterJob],
      30,
      [],
      'none',
      { now: NOW_BEFORE_OPEN, bufferTime: '30m' }
    );
    // 12:30–14:00 would stack against 14:00 with zero gap
    expect(slots).not.toContain('12:30');
    expect(slots).toContain('12:00');
  });

  it('overlap helper matches generateTimeSlots for the 8:00 example', () => {
    expect(
      bookingOverlapsExistingBookings(
        '2026-07-24',
        '10:00',
        90,
        [EXISTING_8AM_90MIN],
        30
      )
    ).toBe(false);
    expect(
      bookingOverlapsExistingBookings(
        '2026-07-24',
        '09:30',
        90,
        [EXISTING_8AM_90MIN],
        30
      )
    ).toBe(true);
    expect(
      bookingOverlapsExistingBookings(
        '2026-07-24',
        '10:00',
        90,
        [EXISTING_8AM_90MIN],
        60
      )
    ).toBe(true);
  });

  it('lead time and buffer hide slots independently', () => {
    const weekly = {
      ...DEFAULT_SCHEDULE,
      friday: { enabled: true, start: '08:00', end: '17:00' },
    } as const;

    // 7:00 now + 1h lead still allows 08:00; 1h buffer after 8:00–9:30 starts at 10:30.
    const bufferWins = generateTimeSlots(
      OPEN_DAY,
      weekly,
      90,
      [EXISTING_8AM_90MIN],
      30,
      [],
      '1h',
      { now: NOW_BEFORE_OPEN, bufferTime: '1h' }
    );
    expect(bufferWins).not.toContain('09:30');
    expect(bufferWins).not.toContain('10:00');
    expect(bufferWins[0]).toBe('10:30');

    // Same buffer, but 3h lead from 8:00 hides 10:00/10:30; first legal start is 11:00.
    const leadWins = generateTimeSlots(
      OPEN_DAY,
      weekly,
      90,
      [EXISTING_8AM_90MIN],
      30,
      [],
      '3h',
      { now: new Date(2026, 6, 24, 8, 0, 0), bufferTime: '30m' }
    );
    expect(leadWins).not.toContain('10:00');
    expect(leadWins).not.toContain('10:30');
    expect(leadWins[0]).toBe('11:00');
  });

  it('findEarliestAvailableSlot honors buffer after an existing booking', () => {
    const result = findEarliestAvailableSlot({
      weeklySchedule: {
        ...DEFAULT_SCHEDULE,
        friday: { enabled: true, start: '08:00', end: '17:00' },
      },
      serviceDurationMinutes: 90,
      existingBookings: [EXISTING_8AM_90MIN],
      bufferTime: '1h',
      now: NOW_BEFORE_OPEN,
      minDate: OPEN_DAY,
    });
    expect(result).not.toBeNull();
    expect(result?.time).toBe('10:30');
  });
});
