import { describe, expect, it } from 'vitest';
import { formatListCardTimeForBooking } from '@/features/availability/booking/dashboard/utils/formatListCardTime';

describe('formatListCardTimeForBooking', () => {
  it('formats morning and noon from startTimeHHmm', () => {
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: '09:00',
        time: 'ignored',
      })
    ).toBe('9:00 AM');
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: '12:00',
        time: 'ignored',
      })
    ).toBe('12:00 PM');
  });

  it('formats afternoon and midnight', () => {
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: '14:30',
        time: 'ignored',
      })
    ).toBe('2:30 PM');
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: '00:00',
        time: 'ignored',
      })
    ).toBe('12:00 AM');
  });

  it('falls back to display time when HH:mm is missing or invalid', () => {
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: '',
        time: '  3:15 PM  ',
      })
    ).toBe('3:15 PM');
    expect(
      formatListCardTimeForBooking({
        startTimeHHmm: 'bad',
        time: 'Backup',
      })
    ).toBe('Backup');
  });
});
