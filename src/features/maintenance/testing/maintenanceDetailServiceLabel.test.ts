import {
  maintenanceCalendarBookingServiceTitle,
  maintenanceDetailServiceLabel,
  maintenanceServiceDisplayName,
} from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import { describe, expect, it } from 'vitest';

describe('[Maintenance] maintenanceDetailServiceLabel', () => {
  it('maps empty and generic snapshots to Maintenance detail', () => {
    expect(maintenanceDetailServiceLabel(null)).toBe('Maintenance detail');
    expect(maintenanceDetailServiceLabel('')).toBe('Maintenance detail');
    expect(maintenanceDetailServiceLabel('Maintenance')).toBe(
      'Maintenance detail'
    );
    expect(maintenanceDetailServiceLabel('maintenance detail')).toBe(
      'Maintenance detail'
    );
  });

  it('strips legacy Maintenance · prefix and keeps the inner name', () => {
    expect(maintenanceDetailServiceLabel('Maintenance · Full ceramic')).toBe(
      'Full ceramic'
    );
  });

  it('preserves a real custom snapshot', () => {
    expect(maintenanceDetailServiceLabel('Express wash')).toBe('Express wash');
  });
});

describe('[Maintenance] maintenanceServiceDisplayName', () => {
  it('returns Maintenance for generic snapshots', () => {
    expect(maintenanceServiceDisplayName('Maintenance')).toBe('Maintenance');
    expect(maintenanceServiceDisplayName('')).toBe('Maintenance');
  });

  it('returns inner name after stripping prefix', () => {
    expect(maintenanceServiceDisplayName('Maintenance · Ceramic')).toBe(
      'Ceramic'
    );
  });
});

describe('[Maintenance] maintenanceCalendarBookingServiceTitle', () => {
  it('uses Maintenance detail for generic enrollments', () => {
    expect(maintenanceCalendarBookingServiceTitle('Maintenance')).toBe(
      'Maintenance detail'
    );
  });

  it('suffixes custom service names for calendar rows', () => {
    expect(maintenanceCalendarBookingServiceTitle('Full detail')).toBe(
      'Full detail (maintenance)'
    );
  });
});
