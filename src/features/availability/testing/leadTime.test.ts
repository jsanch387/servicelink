import { describe, expect, it } from 'vitest';
import { generateTimeSlots } from '../booking/utils/slotGeneration';
import { DEFAULT_SCHEDULE } from '../types/availability';
import {
  DEFAULT_PUBLIC_BOOKING_TIMEZONE,
  isSlotAllowedByLeadTime,
  localDateTimeFromYmdAndHHmm,
  minimumNoticeToMinutes,
  resolvePublicBookingLeadTimeZone,
  toLocalYYYYMMDD,
} from '../utils/minimumNotice';

describe('lead time (minimum_notice)', () => {
  it('maps notice values to minutes', () => {
    expect(minimumNoticeToMinutes('none')).toBe(0);
    expect(minimumNoticeToMinutes('30m')).toBe(30);
    expect(minimumNoticeToMinutes('1h')).toBe(60);
    expect(minimumNoticeToMinutes('12h')).toBe(720);
    expect(minimumNoticeToMinutes('24h')).toBe(1440);
    expect(minimumNoticeToMinutes('1w')).toBe(7 * 24 * 60);
  });

  it('treats unknown or missing values as no lead time', () => {
    expect(minimumNoticeToMinutes(undefined)).toBe(0);
    expect(minimumNoticeToMinutes(null)).toBe(0);
    expect(minimumNoticeToMinutes('garbage')).toBe(0);
  });

  it('formats local dates and datetimes without UTC drift', () => {
    const d = new Date(2026, 6, 24, 23, 30);
    expect(toLocalYYYYMMDD(d)).toBe('2026-07-24');
    const dt = localDateTimeFromYmdAndHHmm('2026-07-24', '09:30');
    expect(dt.getFullYear()).toBe(2026);
    expect(dt.getMonth()).toBe(6);
    expect(dt.getDate()).toBe(24);
    expect(dt.getHours()).toBe(9);
    expect(dt.getMinutes()).toBe(30);
  });

  it('blocks slots inside the lead window and allows slots past it', () => {
    // Friday 2026-07-24, 8:00 AM local
    const now = new Date(2026, 6, 24, 8, 0, 0);

    // 4h lead: 11:30 too soon, 12:00 ok
    expect(isSlotAllowedByLeadTime('2026-07-24', '11:30', '4h', now)).toBe(
      false
    );
    expect(isSlotAllowedByLeadTime('2026-07-24', '12:00', '4h', now)).toBe(
      true
    );

    // 24h lead: everything today blocked, tomorrow after 8:00 ok
    expect(isSlotAllowedByLeadTime('2026-07-24', '16:00', '24h', now)).toBe(
      false
    );
    expect(isSlotAllowedByLeadTime('2026-07-25', '07:30', '24h', now)).toBe(
      false
    );
    expect(isSlotAllowedByLeadTime('2026-07-25', '09:00', '24h', now)).toBe(
      true
    );
  });

  it('with none, still blocks slots already in the past', () => {
    const now = new Date(2026, 6, 24, 10, 0, 0);
    expect(isSlotAllowedByLeadTime('2026-07-24', '09:00', 'none', now)).toBe(
      false
    );
    expect(isSlotAllowedByLeadTime('2026-07-24', '10:00', 'none', now)).toBe(
      true
    );
  });

  it('treats a Pacific afternoon slot as future when the server clock is UTC', () => {
    // 2026-09-02 17:40 UTC = 10:40 AM PDT. 12:00 PDT is still 1h20m away.
    const now = new Date('2026-09-02T17:40:00.000Z');
    expect(
      isSlotAllowedByLeadTime('2026-09-02', '12:00', 'none', {
        now,
        timeZone: 'America/Los_Angeles',
      })
    ).toBe(true);
    expect(
      isSlotAllowedByLeadTime('2026-09-02', '09:00', 'none', {
        now,
        timeZone: 'America/Los_Angeles',
      })
    ).toBe(false);
  });

  it('applies lead time in the named timezone, not UTC wall clock', () => {
    const now = new Date('2026-09-02T17:40:00.000Z'); // 10:40 AM PDT
    expect(
      isSlotAllowedByLeadTime('2026-09-02', '14:00', '4h', {
        now,
        timeZone: 'America/Los_Angeles',
      })
    ).toBe(false);
    expect(
      isSlotAllowedByLeadTime('2026-09-02', '15:00', '4h', {
        now,
        timeZone: 'America/Los_Angeles',
      })
    ).toBe(true);
  });

  it('resolves a valid client timezone and falls back to Pacific', () => {
    expect(resolvePublicBookingLeadTimeZone('America/New_York')).toBe(
      'America/New_York'
    );
    expect(resolvePublicBookingLeadTimeZone('not-a-zone')).toBe(
      DEFAULT_PUBLIC_BOOKING_TIMEZONE
    );
    expect(resolvePublicBookingLeadTimeZone(undefined)).toBe(
      DEFAULT_PUBLIC_BOOKING_TIMEZONE
    );
  });

  it('generateTimeSlots hides too-soon slots for customers', () => {
    // Friday 2026-07-24; default schedule 09:00–17:00
    const day = new Date(2026, 6, 24);
    const now = new Date(2026, 6, 24, 8, 0, 0);

    const slots = generateTimeSlots(
      day,
      DEFAULT_SCHEDULE,
      60,
      [],
      30,
      [],
      '4h',
      now
    );
    expect(slots).not.toContain('09:00');
    expect(slots).not.toContain('11:30');
    expect(slots[0]).toBe('12:00');
  });

  it('generateTimeSlots with none (owner bypass) shows the full day', () => {
    const day = new Date(2026, 6, 24);
    const now = new Date(2026, 6, 20, 8, 0, 0); // days before, nothing in the past

    const withLead = generateTimeSlots(
      day,
      DEFAULT_SCHEDULE,
      60,
      [],
      30,
      [],
      '1w',
      now
    );
    const ownerView = generateTimeSlots(
      day,
      DEFAULT_SCHEDULE,
      60,
      [],
      30,
      [],
      'none',
      now
    );

    // 1w lead blocks 2026-07-24 from 2026-07-20; owner ('none') sees all slots.
    expect(withLead).toEqual([]);
    expect(ownerView[0]).toBe('09:00');
    expect(ownerView.length).toBeGreaterThan(0);
  });
});
