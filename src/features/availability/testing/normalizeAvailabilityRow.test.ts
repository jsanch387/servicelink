import { describe, expect, it } from 'vitest';
import type { BusinessAvailabilityRow } from '../types/availability';
import { DEFAULT_SCHEDULE } from '../types/availability';
import { normalizeAvailabilityRow } from '../utils/normalizeAvailabilityRow';

function baseRow(
  overrides: Partial<BusinessAvailabilityRow> = {}
): BusinessAvailabilityRow {
  return {
    id: 'row-1',
    business_id: 'biz-1',
    accept_bookings: true,
    minimum_notice: 'none',
    weekly_schedule: DEFAULT_SCHEDULE,
    selected_preset: 'mon_fri_9_5',
    time_off_blocks: [],
    created_at: '2026-07-24T00:00:00Z',
    updated_at: '2026-07-24T00:00:00Z',
    ...overrides,
  };
}

describe('normalizeAvailabilityRow', () => {
  it('keeps expanded lead-time values', () => {
    const row = normalizeAvailabilityRow(baseRow({ minimum_notice: '30m' }));
    expect(row.minimum_notice).toBe('30m');
  });

  it('falls back to none for unknown lead time', () => {
    const row = normalizeAvailabilityRow(
      baseRow({ minimum_notice: 'not-a-value' })
    );
    expect(row.minimum_notice).toBe('none');
  });

  it('rewrites legacy single-day time off to canonical range fields', () => {
    const row = normalizeAvailabilityRow(
      baseRow({
        time_off_blocks: [
          {
            id: 'legacy-1',
            // @ts-expect-error legacy shape still present in older DB rows
            date: '2026-07-24',
            start_time: '09:00',
            end_time: '12:00',
            title: 'Doctor',
          } as never,
        ],
      })
    );

    expect(row.time_off_blocks).toEqual([
      {
        id: 'legacy-1',
        start_date: '2026-07-24',
        end_date: '2026-07-24',
        all_day: false,
        start_time: '09:00',
        end_time: '12:00',
        date: '2026-07-24',
        title: 'Doctor',
      },
    ]);
  });

  it('preserves multi-day all-day blocks', () => {
    const row = normalizeAvailabilityRow(
      baseRow({
        time_off_blocks: [
          {
            id: 'range-1',
            start_date: '2026-07-24',
            end_date: '2026-07-27',
            all_day: true,
            start_time: '00:00',
            end_time: '23:59',
            date: '2026-07-24',
            title: 'Vacation',
          },
        ],
      })
    );

    expect(row.time_off_blocks?.[0]).toMatchObject({
      start_date: '2026-07-24',
      end_date: '2026-07-27',
      all_day: true,
      start_time: '00:00',
      end_time: '23:59',
      title: 'Vacation',
    });
  });
});
