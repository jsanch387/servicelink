import { describe, expect, it } from 'vitest';
import {
  configureBookingFlowProgressValue,
  getConfigurePhaseCount,
  getConfigureSubStepIndex,
  getPostScheduleStepCount,
  postConfigureBookingFlowProgressValue,
} from '../utils/publicBookingFlowProgress';

/**
 * Progress semantics: one bar from first configure touch through checkout.
 * Denominator = configure phases (0–2) + post-calendar steps (3 or 4).
 */

describe('publicBookingFlowProgress', () => {
  it('counts configure phases', () => {
    expect(getConfigurePhaseCount(true, true)).toBe(2);
    expect(getConfigurePhaseCount(true, false)).toBe(1);
    expect(getConfigurePhaseCount(false, true)).toBe(1);
    expect(getConfigurePhaseCount(false, false)).toBe(0);
  });

  it('does not drop progress when moving from last configure step to schedule', () => {
    const configureCount = 2;
    const postCount = 3;
    const atAddons = configureBookingFlowProgressValue({
      configurePhaseCount: configureCount,
      postScheduleStepCount: postCount,
      needsPriceStep: true,
      showAddOnSection: true,
      phase: 'addons',
    });
    const atSchedule = postConfigureBookingFlowProgressValue({
      configurePhaseCount: configureCount,
      postScheduleStepCount: postCount,
      step: 'schedule',
    });
    expect(atAddons).toBeLessThan(atSchedule);
    expect(atSchedule).toBeGreaterThan(atAddons);
  });

  it('reaches 100% on last post step without payment', () => {
    expect(
      postConfigureBookingFlowProgressValue({
        configurePhaseCount: 2,
        postScheduleStepCount: 3,
        step: 'review',
      })
    ).toBe(1);
  });

  it('reaches 100% on payment when that step exists', () => {
    expect(
      postConfigureBookingFlowProgressValue({
        configurePhaseCount: 2,
        postScheduleStepCount: 4,
        step: 'payment',
      })
    ).toBe(1);
  });

  it('post step count matches payment gate', () => {
    const enabled = {
      paymentsEnabled: true,
      checkoutMode: 'in_app' as const,
      depositsEnabled: false,
      depositType: 'percent' as const,
      depositValue: 0,
      currency: 'usd',
    };
    expect(getPostScheduleStepCount(enabled, false)).toBe(4);
    expect(getPostScheduleStepCount({ ...enabled, checkoutMode: null }, false)).toBe(
      3
    );
    expect(getPostScheduleStepCount(enabled, true)).toBe(3);
  });
});

describe('Service archetypes → configure indices (QA matrix)', () => {
  it('price + add-ons: two configure indices then calendar continues at index 2', () => {
    expect(getConfigureSubStepIndex(true, true, 'price')).toBe(0);
    expect(getConfigureSubStepIndex(true, true, 'addons')).toBe(1);
    const post = 3;
    const c = 2;
    expect(
      postConfigureBookingFlowProgressValue({
        configurePhaseCount: c,
        postScheduleStepCount: post,
        step: 'schedule',
      })
    ).toBe((c + 0 + 1) / (c + post));
  });

  it('price only: single configure index 0', () => {
    expect(getConfigureSubStepIndex(true, false, 'price')).toBe(0);
    expect(getConfigurePhaseCount(true, false)).toBe(1);
  });

  it('add-ons only: single configure index 0 on addons phase', () => {
    expect(getConfigureSubStepIndex(false, true, 'addons')).toBe(0);
    expect(getConfigurePhaseCount(false, true)).toBe(1);
  });

  it('neither: zero configure phases; calendar-only journey uses post steps only', () => {
    expect(getConfigurePhaseCount(false, false)).toBe(0);
    expect(
      postConfigureBookingFlowProgressValue({
        configurePhaseCount: 0,
        postScheduleStepCount: 3,
        step: 'schedule',
      })
    ).toBeCloseTo(1 / 3, 5);
  });
});
