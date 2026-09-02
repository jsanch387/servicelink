import type {
  CreateBookingJobItem,
  CreateBookingRequest,
  CustomerFormData,
} from '../types';
import type { PublicBookingJobDraft } from './publicBookingJobsCart';
import {
  publicBookingVisitServiceNameSummary,
  sumPublicBookingJobsDurationMinutes,
  sumPublicBookingJobsGrossCents,
} from './publicBookingJobsCart';

function jobVehiclePayload(
  vehicle: PublicBookingJobDraft['vehicle']
): CreateBookingJobItem['vehicle'] | undefined {
  const year = vehicle.year.trim();
  const make = vehicle.make.trim();
  const model = vehicle.model.trim();
  if (!year && !make && !model) return undefined;
  return { year, make, model };
}

function jobPetPayload(
  pet: PublicBookingJobDraft['pet'] | undefined
): CreateBookingJobItem['pet'] | undefined {
  const name = pet?.name.trim() ?? '';
  const species = pet?.species.trim() ?? '';
  const breed = pet?.breed.trim() ?? '';
  const size = pet?.size.trim() ?? '';
  if (!name && !species && !breed && !size) return undefined;
  return { name, species, breed, size };
}

export function buildPublicBookingJobItem(
  job: PublicBookingJobDraft
): CreateBookingJobItem {
  const item: CreateBookingJobItem = {
    serviceId: job.serviceId.trim(),
    serviceName: job.serviceName.trim(),
    servicePriceCents: Math.max(0, Math.round(job.servicePriceCents)),
    durationMinutes: Math.max(1, Math.round(job.durationMinutes)),
    clientJobId: job.localId,
  };
  const optionLabel = job.servicePriceOptionLabel?.trim();
  if (optionLabel) {
    item.servicePriceOptionLabel = optionLabel;
  }
  if (job.selectedAddOns.length > 0) {
    item.selectedAddOns = job.selectedAddOns.map(a => ({
      id: a.id,
      name: a.name,
      priceCents: Math.max(0, Math.round(a.priceCents)),
      durationMinutes:
        a.durationMinutes != null && a.durationMinutes > 0
          ? Math.round(a.durationMinutes)
          : undefined,
    }));
  }
  const vehicle = jobVehiclePayload(job.vehicle);
  if (vehicle) item.vehicle = vehicle;
  const pet = jobPetPayload(job.pet);
  if (pet) item.pet = pet;
  return item;
}

export interface BuildPublicMultiJobBookingBodyArgs {
  businessId: string;
  businessSlug: string;
  jobs: PublicBookingJobDraft[];
  scheduledDate: string;
  startTime: string;
  timeZone?: string;
  customer: CustomerFormData;
  customerServiceLocation?: 'mobile' | 'shop';
  paymentMethodSelected?: 'pay_now' | 'pay_in_person' | 'none';
  promoCode?: string;
  agreedToNotifications?: boolean;
  agreedToPolicy?: boolean;
}

/**
 * Body for `POST /api/public/bookings` — public multi-job visit (`jobs[]`).
 * Omits top-level service fields; vehicles live on each job.
 */
export function buildPublicMultiJobBookingBody(
  args: BuildPublicMultiJobBookingBodyArgs
): CreateBookingRequest {
  const locationType = args.customerServiceLocation;
  return {
    businessId: args.businessId,
    businessSlug: args.businessSlug,
    scheduledDate: args.scheduledDate.trim(),
    startTime: args.startTime.trim(),
    ...(args.timeZone ? { timeZone: args.timeZone } : {}),
    paymentMethodSelected: args.paymentMethodSelected ?? 'none',
    customer: {
      ...args.customer,
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      petName: '',
      petSpecies: '',
      petBreed: '',
      petSize: '',
    },
    jobs: args.jobs.map(buildPublicBookingJobItem),
    ...(locationType
      ? {
          customerServiceLocation: locationType,
          serviceLocationType: locationType,
        }
      : {}),
    ...(args.promoCode?.trim() ? { promoCode: args.promoCode.trim() } : {}),
    ...(typeof args.agreedToNotifications === 'boolean'
      ? { agreedToNotifications: args.agreedToNotifications }
      : {}),
    ...(typeof args.agreedToPolicy === 'boolean'
      ? { agreedToPolicy: args.agreedToPolicy }
      : {}),
  };
}

/** Denormalized fields for checkout draft when using jobs[]. */
export function publicMultiJobCheckoutTotals(jobs: PublicBookingJobDraft[]): {
  serviceName: string;
  durationMinutes: number;
  totalPriceCents: number;
  servicePriceCents: number;
} {
  return {
    serviceName: publicBookingVisitServiceNameSummary(jobs),
    durationMinutes: sumPublicBookingJobsDurationMinutes(jobs),
    totalPriceCents: sumPublicBookingJobsGrossCents(jobs),
    servicePriceCents: jobs.reduce((s, j) => s + j.servicePriceCents, 0),
  };
}
