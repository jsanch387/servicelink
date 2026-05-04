import {
  MAINTENANCE_ANCHOR_PLACEHOLDER_DATE,
  MAINTENANCE_ANCHOR_PLACEHOLDER_TIME,
  hasMaintenanceAnchorScheduled,
  isMaintenanceAnchorPlaceholder,
} from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { describe, expect, it } from 'vitest';

describe('[Maintenance] isMaintenanceAnchorPlaceholder', () => {
  it('is true only for the sentinel date and time pair', () => {
    expect(
      isMaintenanceAnchorPlaceholder({
        anchor_date: MAINTENANCE_ANCHOR_PLACEHOLDER_DATE,
        anchor_time: MAINTENANCE_ANCHOR_PLACEHOLDER_TIME,
      })
    ).toBe(true);
  });

  it('is false when date matches but time differs', () => {
    expect(
      isMaintenanceAnchorPlaceholder({
        anchor_date: MAINTENANCE_ANCHOR_PLACEHOLDER_DATE,
        anchor_time: '10:00',
      })
    ).toBe(false);
  });
});

describe('[Maintenance] hasMaintenanceAnchorScheduled', () => {
  it('is false for placeholder anchor', () => {
    expect(
      hasMaintenanceAnchorScheduled({
        anchor_date: MAINTENANCE_ANCHOR_PLACEHOLDER_DATE,
        anchor_time: MAINTENANCE_ANCHOR_PLACEHOLDER_TIME,
      })
    ).toBe(false);
  });

  it('is false when date or time missing / invalid', () => {
    expect(hasMaintenanceAnchorScheduled({})).toBe(false);
    expect(
      hasMaintenanceAnchorScheduled({
        anchor_date: '05-15-2026',
        anchor_time: '10:00',
      })
    ).toBe(false);
    expect(
      hasMaintenanceAnchorScheduled({
        anchor_date: '2026-05-15',
        anchor_time: '25:00',
      })
    ).toBe(false);
  });

  it('is true for valid YYYY-MM-DD and HH:mm', () => {
    expect(
      hasMaintenanceAnchorScheduled({
        anchor_date: '2026-05-15',
        anchor_time: '10:00',
      })
    ).toBe(true);
    expect(
      hasMaintenanceAnchorScheduled({
        anchor_date: '2026-05-15',
        anchor_time: '09:30',
      })
    ).toBe(true);
  });
});
