import { CREATE_APPOINTMENT_STEP } from '../constants';

export function isAddonsStepSkipped(
  addonCatalogKnown: boolean,
  addonsCount: number
): boolean {
  return Boolean(addonCatalogKnown && addonsCount === 0);
}

/**
 * After add-ons on job 1: customer → location → address → vehicle.
 * Job 2+: straight to vehicle (visit who/where already set).
 */
export function getStepAfterAddons(p: {
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  jobIndex?: number;
}): number {
  if ((p.jobIndex ?? 0) > 0) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }
  return CREATE_APPOINTMENT_STEP.CUSTOMER;
}

/** After customer on job 1: location → address → vehicle. */
export function getStepAfterCustomer(p: {
  locationSkipped?: boolean;
  addressSkipped?: boolean;
}): number {
  if (!p.locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
  if (!p.addressSkipped) return CREATE_APPOINTMENT_STEP.ADDRESS;
  return CREATE_APPOINTMENT_STEP.VEHICLE;
}

/**
 * Linear order of wizard step indices with optional steps removed.
 *
 * Visit flow: service → pricing → add-ons → customer → location → address → vehicle
 * → (add another job loops) → schedule → review
 */
export function getCreateAppointmentVisibleStepOrder(
  pricingSkipped: boolean,
  addonsSkipped: boolean,
  locationSkipped = false,
  addressSkipped = false,
  jobIndex = 0
): number[] {
  const o: number[] = [CREATE_APPOINTMENT_STEP.SERVICE];
  if (!pricingSkipped) o.push(CREATE_APPOINTMENT_STEP.PRICING);
  if (!addonsSkipped) o.push(CREATE_APPOINTMENT_STEP.ADDONS);
  if (jobIndex === 0) {
    o.push(CREATE_APPOINTMENT_STEP.CUSTOMER);
    if (!locationSkipped) o.push(CREATE_APPOINTMENT_STEP.LOCATION);
    if (!addressSkipped) o.push(CREATE_APPOINTMENT_STEP.ADDRESS);
  }
  o.push(CREATE_APPOINTMENT_STEP.VEHICLE);
  if (jobIndex === 0) {
    o.push(CREATE_APPOINTMENT_STEP.SCHEDULE);
  }
  o.push(CREATE_APPOINTMENT_STEP.REVIEW);
  return o;
}

export function getCreateAppointmentWizardStepIndex(
  step: number,
  opts: {
    pricingSkipped: boolean;
    addonsSkipped: boolean;
    locationSkipped?: boolean;
    addressSkipped?: boolean;
    jobIndex?: number;
  }
): number {
  const order = getCreateAppointmentVisibleStepOrder(
    opts.pricingSkipped,
    opts.addonsSkipped,
    opts.locationSkipped ?? false,
    opts.addressSkipped ?? false,
    opts.jobIndex ?? 0
  );
  const idx = order.indexOf(step);
  if (idx < 0) {
    return Math.min(order.length - 1, Math.max(0, step));
  }
  return idx;
}

export function getCreateAppointmentWizardStepCount(opts: {
  pricingSkipped: boolean;
  addonsSkipped: boolean;
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  jobIndex?: number;
}): number {
  return getCreateAppointmentVisibleStepOrder(
    opts.pricingSkipped,
    opts.addonsSkipped,
    opts.locationSkipped ?? false,
    opts.addressSkipped ?? false,
    opts.jobIndex ?? 0
  ).length;
}

export function getCreateAppointmentProgressFraction(
  step: number,
  opts: {
    appointmentConfirmed: boolean;
    pricingSkipped: boolean;
    addonsSkipped: boolean;
    locationSkipped?: boolean;
    addressSkipped?: boolean;
    jobIndex?: number;
  }
): number {
  if (opts.appointmentConfirmed) return 1;
  const stepCount = getCreateAppointmentWizardStepCount(opts);
  const stepIndex = getCreateAppointmentWizardStepIndex(step, opts);
  return (stepIndex + 1) / stepCount;
}

export function getNextStepOnContinue(p: {
  step: number;
  addonsSkipped: boolean;
  pricingSkipped: boolean;
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  jobIndex?: number;
  hasScheduleSlot?: boolean;
}): number {
  const locationSkipped = p.locationSkipped ?? false;
  const addressSkipped = p.addressSkipped ?? false;
  const jobIndex = p.jobIndex ?? 0;
  const hasScheduleSlot = p.hasScheduleSlot ?? false;

  const afterAddons = () =>
    getStepAfterAddons({ locationSkipped, addressSkipped, jobIndex });
  const afterCustomer = () =>
    getStepAfterCustomer({ locationSkipped, addressSkipped });

  if (p.step === CREATE_APPOINTMENT_STEP.SERVICE) {
    if (p.pricingSkipped) {
      return p.addonsSkipped ? afterAddons() : CREATE_APPOINTMENT_STEP.ADDONS;
    }
    return CREATE_APPOINTMENT_STEP.PRICING;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.PRICING) {
    return p.addonsSkipped ? afterAddons() : CREATE_APPOINTMENT_STEP.ADDONS;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.ADDONS) {
    return afterAddons();
  }

  if (p.step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    return afterCustomer();
  }

  if (p.step === CREATE_APPOINTMENT_STEP.LOCATION) {
    return addressSkipped
      ? CREATE_APPOINTMENT_STEP.VEHICLE
      : CREATE_APPOINTMENT_STEP.ADDRESS;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    return hasScheduleSlot
      ? CREATE_APPOINTMENT_STEP.REVIEW
      : CREATE_APPOINTMENT_STEP.SCHEDULE;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    return CREATE_APPOINTMENT_STEP.REVIEW;
  }

  return p.step + 1;
}

export function getPreviousStepOnBack(p: {
  step: number;
  addonsSkipped: boolean;
  pricingSkipped: boolean;
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  jobIndex?: number;
}): number {
  const locationSkipped = p.locationSkipped ?? false;
  const addressSkipped = p.addressSkipped ?? false;
  const jobIndex = p.jobIndex ?? 0;

  if (p.step === CREATE_APPOINTMENT_STEP.SCHEDULE) {
    return CREATE_APPOINTMENT_STEP.VEHICLE;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.REVIEW) {
    return jobIndex > 0
      ? CREATE_APPOINTMENT_STEP.VEHICLE
      : CREATE_APPOINTMENT_STEP.SCHEDULE;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.VEHICLE) {
    if (jobIndex > 0) {
      if (!p.addonsSkipped) return CREATE_APPOINTMENT_STEP.ADDONS;
      if (!p.pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
      return CREATE_APPOINTMENT_STEP.SERVICE;
    }
    if (!addressSkipped) return CREATE_APPOINTMENT_STEP.ADDRESS;
    if (!locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.ADDRESS) {
    if (!locationSkipped) return CREATE_APPOINTMENT_STEP.LOCATION;
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.LOCATION) {
    return CREATE_APPOINTMENT_STEP.CUSTOMER;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.CUSTOMER) {
    if (!p.addonsSkipped) return CREATE_APPOINTMENT_STEP.ADDONS;
    if (!p.pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  if (p.step === CREATE_APPOINTMENT_STEP.ADDONS) {
    if (!p.pricingSkipped) return CREATE_APPOINTMENT_STEP.PRICING;
    return CREATE_APPOINTMENT_STEP.SERVICE;
  }

  return p.step - 1;
}
