import { describe, expect, it } from 'vitest';

import {
  isProAccess,
  needsPaidProResubscribeForDashboard,
} from '../utils/isProAccess';

/** Any non-empty id means “paying customer” vs comped manual Pro */
const BILLED = 'sub_test123';
const CUS = 'cus_test123';

describe('isProAccess', () => {
  const futureEnd = new Date(Date.now() + 86400000).toISOString();
  const pastEnd = new Date(Date.now() - 86400000).toISOString();

  it('returns false when tier is not pro', () => {
    expect(isProAccess('free', futureEnd, 'active', BILLED)).toBe(false);
  });

  it('manual / early-adopter Pro: pro tier, no subscription id, no Stripe customer id', () => {
    expect(isProAccess('pro', null, 'past_due', null, null)).toBe(true);
    expect(isProAccess('pro', futureEnd, null, undefined, undefined)).toBe(
      true
    );
    expect(isProAccess('pro', pastEnd, null, '', '')).toBe(true);
  });

  it('not Pro if Stripe customer exists but subscription id is empty (former subscriber / stale tier)', () => {
    expect(isProAccess('pro', futureEnd, 'active', null, CUS)).toBe(false);
    expect(isProAccess('pro', null, null, '', CUS)).toBe(false);
  });

  it('billed customer: active or trialing is Pro even if period is null or stale', () => {
    expect(isProAccess('pro', null, 'active', BILLED, CUS)).toBe(true);
    expect(isProAccess('pro', pastEnd, 'active', BILLED, CUS)).toBe(true);
    expect(isProAccess('pro', null, 'trialing', BILLED, CUS)).toBe(true);
  });

  it('billed customer: non-active/trialing status revokes Pro', () => {
    expect(isProAccess('pro', futureEnd, 'past_due', BILLED, CUS)).toBe(false);
    expect(isProAccess('pro', futureEnd, 'unpaid', BILLED, CUS)).toBe(false);
    expect(isProAccess('pro', futureEnd, 'canceled', BILLED, CUS)).toBe(false);
    expect(isProAccess('pro', futureEnd, 'incomplete', BILLED, CUS)).toBe(
      false
    );
    expect(
      isProAccess('pro', futureEnd, 'incomplete_expired', BILLED, CUS)
    ).toBe(false);
    expect(isProAccess('pro', futureEnd, 'paused', BILLED, CUS)).toBe(false);
  });

  it('billed customer: empty or null status allows Pro (migration / sync gaps)', () => {
    expect(isProAccess('pro', null, null, BILLED, CUS)).toBe(true);
    expect(isProAccess('pro', null, '', BILLED, CUS)).toBe(true);
  });
});

describe('needsPaidProResubscribeForDashboard', () => {
  const BILLED = 'sub_x';
  const CUS = 'cus_x';

  it('is false when tier is free even with Stripe fields (post-cancel)', () => {
    expect(
      needsPaidProResubscribeForDashboard('free', 'canceled', null, CUS)
    ).toBe(false);
  });

  it('is false when tier is null/empty and Stripe fields set', () => {
    expect(
      needsPaidProResubscribeForDashboard(null, 'canceled', BILLED, CUS)
    ).toBe(false);
  });

  it('is true when tier is pro and Stripe customer exists', () => {
    expect(
      needsPaidProResubscribeForDashboard('pro', 'canceled', null, CUS)
    ).toBe(true);
  });

  it('is true when tier is pro and subscription id exists', () => {
    expect(needsPaidProResubscribeForDashboard('pro', null, BILLED, null)).toBe(
      true
    );
  });

  it('is false when tier is pro but no Stripe billing fields (comped)', () => {
    expect(needsPaidProResubscribeForDashboard('pro', null, null, null)).toBe(
      false
    );
  });
});
