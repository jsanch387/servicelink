/**
 * Owner manual booking — multi-job appointment request parsing & helpers.
 *
 * Model: one appointment (one bookings row) containing 1…N jobs as line items.
 * Schedule is appointment-level: one startTime + duration = sum of job durations.
 */

import type { AddOnAtBooking } from '../types';
import { coerceBookingCents } from './coerceBookingCents';
import {
  isPetSizeValue,
  isPetSpeciesValue,
} from '@/features/customer-management/utils/customerAssetTypes';
import {
  isValidVehicleYearFourDigit,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
  BOOKING_PET_BREED_MAX,
  BOOKING_PET_NAME_MAX,
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
} from './bookingCustomerFieldLimits';

export const OWNER_MANUAL_BOOKING_JOBS_MAX = 20;

export interface OwnerManualBookingJobVehicle {
  year: string;
  make: string;
  model: string;
}

export interface OwnerManualBookingJobPet {
  name: string;
  species: string;
  breed: string;
  size: string;
}

export interface OwnerManualBookingJobInput {
  serviceName: string;
  serviceId?: string | null;
  servicePriceOptionLabel?: string | null;
  servicePriceCents: number;
  selectedAddOns: AddOnAtBooking[];
  durationMinutes: number;
  vehicle: OwnerManualBookingJobVehicle;
  pet?: OwnerManualBookingJobPet;
  /** Mobile local id — not persisted in v1. */
  clientJobId?: string;
}

/** Persisted shape for `bookings.job_details` jsonb. */
export interface BookingJobDetailsItem {
  serviceId: string | null;
  serviceName: string;
  servicePriceOptionLabel: string | null;
  servicePriceCents: number;
  selectedAddOns: AddOnAtBooking[];
  durationMinutes: number;
  vehicle: {
    year: string;
    make: string;
    model: string;
  } | null;
  pet?: {
    name: string;
    species: string;
    breed: string;
    size: string;
  } | null;
}

export type ParseOwnerManualBookingJobsResult =
  | { ok: true; jobs: OwnerManualBookingJobInput[] }
  | { ok: false; error: string };

function strField(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function parseJobVehicle(
  raw: unknown,
  jobIndex: number
):
  | { ok: true; vehicle: OwnerManualBookingJobVehicle }
  | { ok: false; error: string } {
  if (raw == null) {
    return { ok: true, vehicle: { year: '', make: '', model: '' } };
  }
  if (typeof raw !== 'object') {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: vehicle must be an object`,
    };
  }
  const r = raw as Record<string, unknown>;
  const year = sanitizeVehicleYearInput(strField(r.year));
  const make = sanitizeVehicleTextInput(
    strField(r.make),
    BOOKING_VEHICLE_MAKE_MAX
  ).trim();
  const model = sanitizeVehicleTextInput(
    strField(r.model),
    BOOKING_VEHICLE_MODEL_MAX
  ).trim();
  const any = year.length > 0 || make.length > 0 || model.length > 0;
  if (!any) {
    return { ok: true, vehicle: { year: '', make: '', model: '' } };
  }
  if (!year || !make || !model) {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: vehicle year, make, and model are all required when any is set`,
    };
  }
  if (!isValidVehicleYearFourDigit(year)) {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: vehicle year must be a valid 4-digit year`,
    };
  }
  return { ok: true, vehicle: { year, make, model } };
}

function parseJobPet(
  raw: unknown,
  jobIndex: number
):
  | { ok: true; pet: OwnerManualBookingJobPet }
  | { ok: false; error: string } {
  if (raw == null) {
    return { ok: true, pet: { name: '', species: '', breed: '', size: '' } };
  }
  if (typeof raw !== 'object') {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: pet must be an object`,
    };
  }
  const r = raw as Record<string, unknown>;
  const name = strField(r.name).trim().slice(0, BOOKING_PET_NAME_MAX);
  const species = strField(r.species).trim();
  const breed = strField(r.breed).trim().slice(0, BOOKING_PET_BREED_MAX);
  const size = strField(r.size).trim();
  const any = name.length > 0 || species.length > 0 || breed.length > 0 || size.length > 0;
  if (!any) {
    return { ok: true, pet: { name: '', species: '', breed: '', size: '' } };
  }
  if (!name || !species || !breed || !size) {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: pet name, species, breed, and size are all required when any is set`,
    };
  }
  if (!isPetSpeciesValue(species)) {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: pet species is invalid`,
    };
  }
  if (!isPetSizeValue(size)) {
    return {
      ok: false,
      error: `Job ${jobIndex + 1}: pet size is invalid`,
    };
  }
  return { ok: true, pet: { name, species, breed, size } };
}

/**
 * Parse and validate `jobs[]` for owner manual booking.
 * Returns English API error messages.
 */
export function parseOwnerManualBookingJobs(
  raw: unknown
): ParseOwnerManualBookingJobsResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Invalid jobs array' };
  }
  if (raw.length < 1 || raw.length > OWNER_MANUAL_BOOKING_JOBS_MAX) {
    return {
      ok: false,
      error: `jobs must contain between 1 and ${OWNER_MANUAL_BOOKING_JOBS_MAX} items`,
    };
  }

  const jobs: OwnerManualBookingJobInput[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Job ${i + 1}: invalid job object` };
    }
    const j = item as Record<string, unknown>;
    const serviceName = strField(j.serviceName).trim();
    if (!serviceName) {
      return { ok: false, error: `Job ${i + 1}: service name is required` };
    }

    const durationMinutes =
      typeof j.durationMinutes === 'number'
        ? j.durationMinutes
        : Number(j.durationMinutes);
    if (
      !Number.isFinite(durationMinutes) ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1
    ) {
      return {
        ok: false,
        error: `Job ${i + 1}: duration must be an integer of at least 1 minute`,
      };
    }

    if (
      j.servicePriceCents === undefined ||
      j.servicePriceCents === null ||
      (typeof j.servicePriceCents !== 'number' &&
        typeof j.servicePriceCents !== 'string')
    ) {
      return {
        ok: false,
        error: `Job ${i + 1}: service price (cents) is required`,
      };
    }
    const servicePriceCents = coerceBookingCents(j.servicePriceCents);

    const serviceIdRaw = j.serviceId;
    const serviceId =
      typeof serviceIdRaw === 'string' && serviceIdRaw.trim()
        ? serviceIdRaw.trim()
        : null;
    const isCustom = !serviceId;

    const optionLabel = strField(j.servicePriceOptionLabel).trim();
    if (isCustom && optionLabel) {
      return {
        ok: false,
        error: `Job ${i + 1}: custom jobs cannot include a pricing option label`,
      };
    }

    let selectedAddOns: AddOnAtBooking[] = [];
    if (j.selectedAddOns != null) {
      if (!Array.isArray(j.selectedAddOns)) {
        return {
          ok: false,
          error: `Job ${i + 1}: selectedAddOns must be an array`,
        };
      }
      if (isCustom && j.selectedAddOns.length > 0) {
        return {
          ok: false,
          error: `Job ${i + 1}: custom jobs cannot include add-ons`,
        };
      }
      selectedAddOns = j.selectedAddOns.map(addOn => {
        const a =
          addOn && typeof addOn === 'object'
            ? (addOn as Record<string, unknown>)
            : {};
        const durationRaw = a.durationMinutes;
        const durationMinutesAddOn =
          durationRaw === undefined || durationRaw === null
            ? undefined
            : typeof durationRaw === 'number'
              ? durationRaw
              : Number(durationRaw);
        return {
          id: strField(a.id),
          name: strField(a.name),
          priceCents: coerceBookingCents(a.priceCents),
          durationMinutes:
            durationMinutesAddOn != null &&
            Number.isFinite(durationMinutesAddOn)
              ? durationMinutesAddOn
              : undefined,
        };
      });
    }

    const vehicleParsed = parseJobVehicle(j.vehicle, i);
    if (!vehicleParsed.ok) return vehicleParsed;
    const petParsed = parseJobPet(j.pet, i);
    if (!petParsed.ok) return petParsed;

    const clientJobId = strField(j.clientJobId).trim() || undefined;

    jobs.push({
      serviceName,
      serviceId,
      servicePriceOptionLabel: optionLabel || null,
      servicePriceCents,
      selectedAddOns,
      durationMinutes,
      vehicle: vehicleParsed.vehicle,
      pet: petParsed.pet,
      clientJobId,
    });
  }

  return { ok: true, jobs };
}

/**
 * Add minutes to an H:mm / HH:mm wall clock on the same day.
 * Returns null if the result would land on or after midnight (same-day only).
 */
export function addMinutesToStartTimeSameDay(
  startTime: string,
  minutesToAdd: number
): string | null {
  const match = startTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(min) ||
    hour < 0 ||
    hour > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }
  const total = hour * 60 + min + Math.max(0, Math.round(minutesToAdd));
  if (total >= 24 * 60) return null;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** Normalize start time to HH:mm; null if invalid. */
export function normalizeStartTimeHHmm(startTime: string): string | null {
  return addMinutesToStartTimeSameDay(startTime.trim(), 0);
}

/** True when appointment start + total duration fits on the same calendar day. */
export function appointmentFitsSameDay(
  startTime: string,
  totalDurationMinutes: number
): boolean {
  const start = normalizeStartTimeHHmm(startTime);
  if (!start) return false;
  // Ending exactly at midnight is allowed: start + duration may equal 24:00.
  const match = start.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const end = hour * 60 + min + Math.max(0, Math.round(totalDurationMinutes));
  return end <= 24 * 60;
}

/** Display name for one job (option label appended when present). */
export function storedServiceNameForJob(
  job: OwnerManualBookingJobInput
): string {
  const optionLabel = job.servicePriceOptionLabel?.trim();
  return optionLabel
    ? `${job.serviceName.trim()} — ${optionLabel}`
    : job.serviceName.trim();
}

export function sumJobDurationMinutes(
  jobs: OwnerManualBookingJobInput[]
): number {
  return jobs.reduce((sum, j) => sum + j.durationMinutes, 0);
}

export function jobGrossCents(job: OwnerManualBookingJobInput): number {
  return (
    job.servicePriceCents +
    job.selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0)
  );
}

export function sumJobGrossCents(jobs: OwnerManualBookingJobInput[]): number {
  return jobs.reduce((sum, j) => sum + jobGrossCents(j), 0);
}

export function sumJobServicePriceCents(
  jobs: OwnerManualBookingJobInput[]
): number {
  return jobs.reduce((sum, j) => sum + j.servicePriceCents, 0);
}

/** Top-level service_name snapshot for list/calendar. */
export function appointmentServiceNameSummary(
  jobs: OwnerManualBookingJobInput[]
): string {
  if (jobs.length === 1) return storedServiceNameForJob(jobs[0]);
  const first = storedServiceNameForJob(jobs[0]);
  const more = jobs.length - 1;
  return `${first} + ${more} more`;
}

export function toBookingJobDetails(
  jobs: OwnerManualBookingJobInput[]
): BookingJobDetailsItem[] {
  return jobs.map(job => {
    const hasVehicle =
      Boolean(job.vehicle.year) ||
      Boolean(job.vehicle.make) ||
      Boolean(job.vehicle.model);
    const pet = job.pet ?? { name: '', species: '', breed: '', size: '' };
    const hasPet =
      Boolean(pet.name) ||
      Boolean(pet.species) ||
      Boolean(pet.breed) ||
      Boolean(pet.size);
    return {
      serviceId: job.serviceId ?? null,
      serviceName: job.serviceName.trim(),
      servicePriceOptionLabel: job.servicePriceOptionLabel?.trim() || null,
      servicePriceCents: job.servicePriceCents,
      selectedAddOns: job.selectedAddOns,
      durationMinutes: job.durationMinutes,
      vehicle: hasVehicle
        ? {
            year: job.vehicle.year,
            make: job.vehicle.make,
            model: job.vehicle.model,
          }
        : null,
      pet: hasPet
        ? {
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            size: pet.size,
          }
        : null,
    };
  });
}
