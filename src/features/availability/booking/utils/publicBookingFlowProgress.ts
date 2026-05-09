import type { PublicBookingPaymentSettings } from '../types';

export type PublicBookingPostCalendarStep =
  | 'schedule'
  | 'details'
  | 'review'
  | 'payment';

/** Count of configure sub-steps (price row + add-ons row) for this service. */
export function getConfigurePhaseCount(
  needsPriceStep: boolean,
  showAddOnSection: boolean
): number {
  return (needsPriceStep ? 1 : 0) + (showAddOnSection ? 1 : 0);
}

/** Same rule as `AvailabilityBookingPage` `shouldShowPaymentStep` → 4 or 3 post-calendar steps. */
export function getPostScheduleStepCount(
  paymentSettings: PublicBookingPaymentSettings | null | undefined,
  isOwnerManualBooking: boolean
): number {
  const paymentSettingsEnabled =
    paymentSettings?.paymentsEnabled === true && !isOwnerManualBooking;
  const hasCheckoutModeConfigured = paymentSettings?.checkoutMode != null;
  if (paymentSettingsEnabled && hasCheckoutModeConfigured) return 4;
  return 3;
}

/** 0-based index within configure only (price then add-ons when both exist). */
export function getConfigureSubStepIndex(
  needsPriceStep: boolean,
  showAddOnSection: boolean,
  phase: 'price' | 'addons'
): number {
  if (needsPriceStep && showAddOnSection) return phase === 'price' ? 0 : 1;
  if (needsPriceStep) return 0;
  if (showAddOnSection) return 0;
  return 0;
}

export function getCalendarPostStepIndex(
  step: PublicBookingPostCalendarStep
): number {
  const m: Record<PublicBookingPostCalendarStep, number> = {
    schedule: 0,
    details: 1,
    review: 2,
    payment: 3,
  };
  return m[step];
}

/** Progress 0–1 for configure screens (before calendar). */
export function configureBookingFlowProgressValue(params: {
  configurePhaseCount: number;
  postScheduleStepCount: number;
  needsPriceStep: boolean;
  showAddOnSection: boolean;
  phase: 'price' | 'addons';
}): number {
  const {
    configurePhaseCount,
    postScheduleStepCount,
    needsPriceStep,
    showAddOnSection,
    phase,
  } = params;
  const total = configurePhaseCount + postScheduleStepCount;
  if (total <= 0) return 1;
  const idx = getConfigureSubStepIndex(needsPriceStep, showAddOnSection, phase);
  return (idx + 1) / total;
}

/** Progress 0–1 for calendar → details → review → (payment). */
export function postConfigureBookingFlowProgressValue(params: {
  configurePhaseCount: number;
  postScheduleStepCount: number;
  step: PublicBookingPostCalendarStep;
}): number {
  const { configurePhaseCount, postScheduleStepCount, step } = params;
  const total = configurePhaseCount + postScheduleStepCount;
  if (total <= 0) return 1;
  const idx = configurePhaseCount + getCalendarPostStepIndex(step);
  return (idx + 1) / total;
}
