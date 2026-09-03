import { formatNotificationTime } from '../utils/formatNotificationTime';
import { describe, expect, it } from 'vitest';

const NOW = Date.parse('2026-09-02T18:00:00.000Z');

describe('formatNotificationTime', () => {
  it('returns Just now under a minute', () => {
    expect(formatNotificationTime('2026-09-02T17:59:30.000Z', NOW)).toBe(
      'Just now'
    );
  });

  it('returns minutes and hours', () => {
    expect(formatNotificationTime('2026-09-02T17:50:00.000Z', NOW)).toBe(
      '10m ago'
    );
    expect(formatNotificationTime('2026-09-02T15:00:00.000Z', NOW)).toBe(
      '3h ago'
    );
  });

  it('returns days within a week', () => {
    expect(formatNotificationTime('2026-08-31T18:00:00.000Z', NOW)).toBe(
      '2d ago'
    );
  });
});
