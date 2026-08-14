import { describe, expect, it } from 'vitest';
import {
  periodVisitIsOnFile,
  resolveMembershipVisitStatus,
  shouldSendMembershipPeriodVisitReminder,
} from '../server/membershipVisitStatus';

const periodStart = '2026-08-14T00:00:00.000Z';

describe('resolveMembershipVisitStatus', () => {
  it('is scheduled when a period booking is linked and still upcoming', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
        periodVisitBookingStatus: 'confirmed',
      })
    ).toBe('scheduled');
  });

  it('is completed when the linked period booking is done', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
        periodVisitBookingStatus: 'completed',
      })
    ).toBe('completed');
  });

  it('needs a visit again if the linked booking was cancelled', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
        periodVisitBookingStatus: 'cancelled',
      })
    ).toBe('needs_visit');
  });

  it('treats a linked booking as scheduled when status is unknown', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
      })
    ).toBe('scheduled');
  });

  it('needs a visit when no booking is linked this period', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        currentPeriodStart: periodStart,
        periodVisitBookingId: null,
        periodVisitPeriodStart: null,
      })
    ).toBe('needs_visit');
  });

  it('does not need a visit when billing is canceled', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'canceled',
        currentPeriodStart: periodStart,
        periodVisitBookingId: null,
        periodVisitPeriodStart: null,
      })
    ).toBe('none');
  });

  it('does not need a visit when the plan was removed', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        planRemoved: true,
        currentPeriodStart: periodStart,
        periodVisitBookingId: null,
        periodVisitPeriodStart: null,
      })
    ).toBe('none');
  });

  it('does not need a visit when cancel is scheduled at period end', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        cancelScheduled: true,
        currentPeriodStart: periodStart,
        periodVisitBookingId: null,
        periodVisitPeriodStart: null,
      })
    ).toBe('none');
  });

  it('still shows a leftover scheduled visit after cancel', () => {
    expect(
      resolveMembershipVisitStatus({
        status: 'canceled',
        cancelScheduled: false,
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
        periodVisitBookingStatus: 'confirmed',
      })
    ).toBe('scheduled');
    expect(
      resolveMembershipVisitStatus({
        status: 'active',
        cancelScheduled: true,
        currentPeriodStart: periodStart,
        periodVisitBookingId: 'booking-1',
        periodVisitPeriodStart: periodStart,
        periodVisitBookingStatus: 'confirmed',
      })
    ).toBe('scheduled');
  });
});

describe('shouldSendMembershipPeriodVisitReminder', () => {
  const base = {
    visitStatus: 'needs_visit' as const,
    status: 'active' as const,
    cancelScheduled: false,
    periodStart: periodStart,
    alreadyRemindedForPeriod: false,
  };

  it('sends for an active member who still needs a visit', () => {
    expect(shouldSendMembershipPeriodVisitReminder(base)).toBe(true);
  });

  it('does not send when the member canceled or is canceling', () => {
    expect(
      shouldSendMembershipPeriodVisitReminder({
        ...base,
        cancelScheduled: true,
      })
    ).toBe(false);
    expect(
      shouldSendMembershipPeriodVisitReminder({
        ...base,
        status: 'canceled',
      })
    ).toBe(false);
  });

  it('does not send when a visit is already on file', () => {
    expect(
      shouldSendMembershipPeriodVisitReminder({
        ...base,
        visitStatus: 'scheduled',
      })
    ).toBe(false);
  });
});

describe('periodVisitIsOnFile', () => {
  it('is true for scheduled and completed', () => {
    expect(periodVisitIsOnFile('scheduled')).toBe(true);
    expect(periodVisitIsOnFile('completed')).toBe(true);
    expect(periodVisitIsOnFile('needs_visit')).toBe(false);
    expect(periodVisitIsOnFile('none')).toBe(false);
  });
});
