import { describe, expect, it } from 'vitest';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { buildOwnerFlexibleWeeklySchedule } from '../utils/ownerFlexibleSchedule';

const baseSchedule = {
  sunday: { enabled: false, start: '09:00', end: '17:00' },
  monday: { enabled: true, start: '08:00', end: '18:00' },
  tuesday: { enabled: true, start: '08:00', end: '18:00' },
  wednesday: { enabled: true, start: '08:00', end: '18:00' },
  thursday: { enabled: true, start: '08:00', end: '18:00' },
  friday: { enabled: true, start: '08:00', end: '18:00' },
  saturday: { enabled: false, start: '', end: '' },
} satisfies WeeklySchedule;

describe('buildOwnerFlexibleWeeklySchedule', () => {
  it('keeps open-day hours and enables closed days for squeeze-ins', () => {
    const flex = buildOwnerFlexibleWeeklySchedule(baseSchedule);
    expect(flex.monday).toEqual({
      enabled: true,
      start: '08:00',
      end: '18:00',
    });
    expect(flex.sunday.enabled).toBe(true);
    expect(flex.sunday.start).toBe('09:00');
    expect(flex.sunday.end).toBe('17:00');
    expect(flex.saturday.enabled).toBe(true);
    expect(flex.saturday.start).toBe('09:00');
    expect(flex.saturday.end).toBe('17:00');
  });
});
