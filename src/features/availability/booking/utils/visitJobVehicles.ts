import { isValidVehicleYearFourDigit } from './bookingCustomerFieldLimits';
import type { PublicBookingJobDraft } from '../types';

export function isJobVehicleComplete(vehicle: {
  year?: string | null;
  make?: string | null;
  model?: string | null;
}): boolean {
  const year = (vehicle.year ?? '').trim();
  const make = (vehicle.make ?? '').trim();
  const model = (vehicle.model ?? '').trim();
  if (!year || !make || !model) return false;
  return isValidVehicleYearFourDigit(year);
}

/** True when every visit job has a complete year/make/model. */
export function areVisitJobVehiclesComplete(
  jobs: PublicBookingJobDraft[]
): boolean {
  if (jobs.length === 0) return false;
  return jobs.every(job => isJobVehicleComplete(job.vehicle));
}

/** First job still missing a complete vehicle — for actionable toast copy. */
export function firstIncompleteVisitJob(
  jobs: PublicBookingJobDraft[]
): PublicBookingJobDraft | null {
  return jobs.find(job => !isJobVehicleComplete(job.vehicle)) ?? null;
}
