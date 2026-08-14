import { describe, expect, it } from 'vitest';
import {
  evaluateMembershipScheduleLinkThrottle,
  MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS,
  MEMBERSHIP_SCHEDULE_LINK_MAX_PER_PERIOD,
  stampMembershipScheduleLinkMetadata,
} from '../server/membershipScheduleLinkThrottle';

const periodStart = '2026-08-14T00:00:00.000Z';

describe('evaluateMembershipScheduleLinkThrottle', () => {
  it('allows the first send', () => {
    expect(
      evaluateMembershipScheduleLinkThrottle({
        currentPeriodStart: periodStart,
        metadata: {},
      }).ok
    ).toBe(true);
  });

  it('blocks a second send during the cooldown', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z');
    const result = evaluateMembershipScheduleLinkThrottle({
      nowMs: now,
      currentPeriodStart: periodStart,
      metadata: {
        schedule_link_sent_at: new Date(now - 30_000).toISOString(),
        schedule_link_sent_for_period_start: periodStart,
        schedule_link_send_count: 1,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('cooldown');
      expect(result.retryAfterSec).toBeGreaterThan(0);
      expect(result.retryAfterSec).toBeLessThanOrEqual(
        MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS / 1000
      );
    }
  });

  it('allows another send after the cooldown', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z');
    expect(
      evaluateMembershipScheduleLinkThrottle({
        nowMs: now,
        currentPeriodStart: periodStart,
        metadata: {
          schedule_link_sent_at: new Date(
            now - MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS - 1000
          ).toISOString(),
          schedule_link_sent_for_period_start: periodStart,
          schedule_link_send_count: 1,
        },
      }).ok
    ).toBe(true);
  });

  it('caps sends for the same period', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z');
    const result = evaluateMembershipScheduleLinkThrottle({
      nowMs: now,
      currentPeriodStart: periodStart,
      metadata: {
        schedule_link_sent_at: new Date(
          now - MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS - 1000
        ).toISOString(),
        schedule_link_sent_for_period_start: periodStart,
        schedule_link_send_count: MEMBERSHIP_SCHEDULE_LINK_MAX_PER_PERIOD,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('period_cap');
  });

  it('resets the cap when the billing period advances', () => {
    const now = Date.parse('2026-09-14T12:00:00.000Z');
    expect(
      evaluateMembershipScheduleLinkThrottle({
        nowMs: now,
        currentPeriodStart: '2026-09-14T00:00:00.000Z',
        metadata: {
          schedule_link_sent_at: new Date(
            now - MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MS - 1000
          ).toISOString(),
          schedule_link_sent_for_period_start: periodStart,
          schedule_link_send_count: MEMBERSHIP_SCHEDULE_LINK_MAX_PER_PERIOD,
        },
      }).ok
    ).toBe(true);
  });
});

describe('stampMembershipScheduleLinkMetadata', () => {
  it('increments the count for the same period', () => {
    const stamped = stampMembershipScheduleLinkMetadata(
      {
        schedule_link_sent_for_period_start: periodStart,
        schedule_link_send_count: 1,
      },
      periodStart,
      '2026-08-14T12:00:00.000Z'
    );
    expect(stamped.schedule_link_send_count).toBe(2);
    expect(stamped.schedule_link_sent_at).toBe('2026-08-14T12:00:00.000Z');
  });
});
