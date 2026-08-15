import type {
  CreateBookingJobItem,
  CreateBookingRequest,
} from '@/features/availability/booking/types';
import type {
  CreateAppointmentJobSnapshot,
  CreateAppointmentVisitState,
} from '../types';

function jobVehiclePayload(
  vehicle: CreateAppointmentJobSnapshot['vehicle']
): CreateBookingJobItem['vehicle'] | undefined {
  const year = vehicle.year.trim();
  const make = vehicle.make.trim();
  const model = vehicle.model.trim();
  if (!year && !make && !model) return undefined;
  return { year, make, model };
}

export function buildOwnerCreateAppointmentJobItem(
  job: CreateAppointmentJobSnapshot
): CreateBookingJobItem {
  const optionLabel = job.pricingOption?.label?.trim() || null;
  const item: CreateBookingJobItem = {
    serviceName: job.serviceName.trim() || 'Custom job',
    servicePriceCents: Math.max(0, Math.round(job.servicePriceCents)),
    durationMinutes: Math.max(1, Math.round(job.durationMinutes)),
    clientJobId: job.localId,
  };

  if (!job.isCustomJob && job.serviceId?.trim()) {
    item.serviceId = job.serviceId.trim();
  }

  if (optionLabel) {
    item.servicePriceOptionLabel = optionLabel;
  }

  if (!job.isCustomJob && job.selectedAddOns.length > 0) {
    item.selectedAddOns = job.selectedAddOns.map(a => ({
      id: a.id,
      name: a.name,
      priceCents: Math.max(0, Math.round(a.priceCents)),
      durationMinutes:
        a.durationMinutes > 0 ? Math.round(a.durationMinutes) : undefined,
    }));
  }

  const vehicle = jobVehiclePayload(job.vehicle);
  if (vehicle) item.vehicle = vehicle;

  return item;
}

export interface BuildOwnerCreateAppointmentBodyArgs {
  businessId: string;
  businessSlug: string;
  visit: CreateAppointmentVisitState;
  jobs: CreateAppointmentJobSnapshot[];
  membershipId?: string | null;
}

/**
 * Body for `POST /api/public/bookings` — owner multi-job appointment
 * (`ownerManualBooking: true` + `jobs[]`), matching the mobile contract.
 */
export function buildOwnerCreateAppointmentBody(
  args: BuildOwnerCreateAppointmentBodyArgs
): CreateBookingRequest {
  const { businessId, businessSlug, visit, jobs } = args;
  const locationType = visit.locationType ?? 'mobile';
  const membershipId = args.membershipId?.trim() || undefined;

  return {
    businessId,
    businessSlug,
    scheduledDate: visit.scheduledDate!.trim(),
    startTime: visit.startTime!.trim(),
    paymentMethodSelected: membershipId ? 'membership' : 'none',
    ownerManualBooking: true,
    serviceLocationType: locationType,
    customerServiceLocation: locationType,
    applySale: membershipId ? false : visit.applySale,
    ...(membershipId ? { membershipId } : {}),
    customer: {
      fullName: visit.customer.fullName.trim(),
      email: visit.customer.email.trim(),
      phone: visit.customer.phone.trim(),
      streetAddress: visit.address.street.trim(),
      unitApt: visit.address.unit.trim(),
      city: visit.address.city.trim(),
      state: visit.address.state.trim(),
      zip: visit.address.zip.trim(),
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      notes: visit.notes.trim(),
    },
    jobs: jobs.map(buildOwnerCreateAppointmentJobItem),
  };
}
