import {
  formatNextAppointmentRelativeDay,
  formatNextInDays,
} from '@/features/customer-management/utils/formatNextInDays';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('[Core] relative day labels', () => {
  it('returns Today for zero or negative', () => {
    // Core copy rule for same-day (or edge) appointments.
    expect(formatNextInDays(0)).toBe('Today');
    expect(formatNextInDays(-1)).toBe('Today');
  });

  it('returns Tomorrow for 1 day', () => {
    expect(formatNextInDays(1)).toBe('Tomorrow');
  });

  it('returns in N days for values above 1', () => {
    expect(formatNextInDays(7)).toBe('in 7 days');
  });
});

describe('[Core] next appointment day helper', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses local date math from scheduledDate when valid', () => {
    // Locks system date so assertions are stable.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T10:00:00'));

    expect(formatNextAppointmentRelativeDay('2026-03-25', 10)).toBe('Today');
    expect(formatNextAppointmentRelativeDay('2026-03-26', 10)).toBe('Tomorrow');
    expect(formatNextAppointmentRelativeDay('2026-03-30', 10)).toBe('in 5 days');
  });

  it('falls back to server daysUntil when date is invalid/missing', () => {
    // Defensive fallback when scheduled date string is not usable.
    expect(formatNextAppointmentRelativeDay('bad-date', 2)).toBe('in 2 days');
    expect(formatNextAppointmentRelativeDay(null, 1)).toBe('Tomorrow');
    expect(formatNextAppointmentRelativeDay(undefined, 0)).toBe('Today');
  });

  it('returns em dash when no usable input is provided', () => {
    expect(formatNextAppointmentRelativeDay(null, null)).toBe('—');
  });
});
