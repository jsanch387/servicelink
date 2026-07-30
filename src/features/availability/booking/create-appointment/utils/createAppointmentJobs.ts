import {
  CREATE_APPOINTMENT_MAX_JOBS,
  CREATE_APPOINTMENT_MAX_JOBS_MESSAGE,
} from '../constants';
import type {
  CreateAppointmentJobDraft,
  CreateAppointmentJobSnapshot,
} from '../types';
import {
  isCustomJobPricingComplete,
  isVehicleStepComplete,
} from './createAppointmentValidators';

export function snapshotJobDraft(
  draft: CreateAppointmentJobDraft
): CreateAppointmentJobSnapshot | null {
  if (draft.isCustomJob) {
    if (
      !isCustomJobPricingComplete({
        serviceName: draft.serviceName,
        customPriceLabel: draft.customPriceLabel,
        durationMinutes: draft.durationMinutes,
      })
    ) {
      return null;
    }
  } else if (!draft.serviceId || !draft.serviceName.trim()) {
    return null;
  }
  if (!isVehicleStepComplete(draft.vehicle)) return null;

  const addonDuration = draft.selectedAddOns.reduce(
    (s, a) => s + (a.durationMinutes > 0 ? a.durationMinutes : 0),
    0
  );

  return {
    localId: draft.localId,
    isCustomJob: draft.isCustomJob,
    serviceId: draft.serviceId,
    serviceName: draft.serviceName.trim() || 'Custom job',
    pricingOption: draft.pricingOption,
    selectedAddOns: [...draft.selectedAddOns],
    durationMinutes: draft.durationMinutes + addonDuration,
    servicePriceCents: draft.servicePriceCents,
    vehicle: { ...draft.vehicle },
  };
}

export function canAddAnotherJob(p: {
  committedCount: number;
  draft: CreateAppointmentJobDraft;
}): { ok: true } | { ok: false; reason: string } {
  if (p.committedCount + 1 >= CREATE_APPOINTMENT_MAX_JOBS) {
    return { ok: false, reason: CREATE_APPOINTMENT_MAX_JOBS_MESSAGE };
  }
  if (!snapshotJobDraft(p.draft)) {
    return { ok: false, reason: 'Finish this job before adding another.' };
  }
  return { ok: true };
}

/** Duration of the active draft (base + add-on minutes). */
export function draftDurationMinutes(
  draft: CreateAppointmentJobDraft
): number {
  const addonDuration = draft.selectedAddOns.reduce(
    (s, a) => s + (a.durationMinutes > 0 ? a.durationMinutes : 0),
    0
  );
  return Math.max(0, draft.durationMinutes + addonDuration);
}

/** Visit length for scheduling: committed jobs + current draft. */
export function visitDurationMinutes(
  committed: CreateAppointmentJobSnapshot[],
  draft: CreateAppointmentJobDraft
): number {
  const committedTotal = committed.reduce((s, j) => s + j.durationMinutes, 0);
  return committedTotal + draftDurationMinutes(draft);
}

/** Jobs to show on review / POST: committed + current draft snapshot. */
export function reviewJobsFromState(
  committed: CreateAppointmentJobSnapshot[],
  draft: CreateAppointmentJobDraft
): CreateAppointmentJobSnapshot[] {
  const snap = snapshotJobDraft(draft);
  return snap ? [...committed, snap] : [...committed];
}
