/**
 * Safe parse of `bookings.job_details` jsonb for invoices, emails, and amount due.
 */

import type { AddOnAtBooking } from '../types';
import type { BookingJobDetailsItem } from './ownerManualBookingJobs';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function parseAddOns(raw: unknown): AddOnAtBooking[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const r = item as Record<string, unknown>;
    const name = str(r.name);
    const priceCents = r.priceCents;
    if (
      !name ||
      typeof priceCents !== 'number' ||
      !Number.isFinite(priceCents) ||
      priceCents < 0
    ) {
      return [];
    }
    const id = str(r.id) || name;
    return [{ id, name, priceCents: Math.round(priceCents) }];
  });
}

function parseVehicle(raw: unknown): BookingJobDetailsItem['vehicle'] {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const year = str(r.year);
  const make = str(r.make);
  const model = str(r.model);
  if (!year && !make && !model) return null;
  return { year, make, model };
}

function parsePet(raw: unknown): NonNullable<BookingJobDetailsItem['pet']> | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name);
  const species = str(r.species);
  const breed = str(r.breed);
  const size = str(r.size);
  if (!name && !species && !breed && !size) return null;
  return { name, species, breed, size };
}

/** Returns [] when missing or invalid — never throws. */
export function parseStoredBookingJobDetails(
  raw: unknown
): BookingJobDetailsItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const jobs: BookingJobDetailsItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const serviceName = str(r.serviceName);
    if (!serviceName) continue;

    const priceRaw = r.servicePriceCents;
    const servicePriceCents =
      typeof priceRaw === 'number' && Number.isFinite(priceRaw) && priceRaw >= 0
        ? Math.round(priceRaw)
        : 0;

    const durationRaw = r.durationMinutes;
    const durationMinutes =
      typeof durationRaw === 'number' &&
      Number.isFinite(durationRaw) &&
      durationRaw >= 0
        ? Math.round(durationRaw)
        : 0;

    const option = str(r.servicePriceOptionLabel);
    const serviceId = str(r.serviceId);

    jobs.push({
      serviceId: serviceId || null,
      serviceName,
      servicePriceOptionLabel: option || null,
      servicePriceCents,
      selectedAddOns: parseAddOns(r.selectedAddOns),
      durationMinutes,
      vehicle: parseVehicle(r.vehicle),
      pet: parsePet(r.pet),
    });
  }

  return jobs;
}

export function formatJobVehicleLine(
  vehicle: BookingJobDetailsItem['vehicle'] | null | undefined
): string | null {
  if (!vehicle) return null;
  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .map(p => (p ?? '').trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function formatJobPetLine(
  pet: BookingJobDetailsItem['pet'] | null | undefined
): string | null {
  if (!pet) return null;
  const identity = [pet.name, pet.breed]
    .map(p => (p ?? '').trim())
    .filter(Boolean)
    .join(' · ');
  const extras = [pet.species, pet.size]
    .map(p => (p ?? '').trim())
    .filter(Boolean)
    .join(' · ');
  if (identity && extras) return `${identity} · ${extras}`;
  return identity || extras || null;
}

/** Sum service cents across job_details (multi-job appointment total). */
export function sumJobDetailsServiceCents(raw: unknown): number {
  return parseStoredBookingJobDetails(raw).reduce(
    (sum, job) => sum + job.servicePriceCents,
    0
  );
}

/** Sum add-on cents across job_details (for multi-job amount due). */
export function sumJobDetailsAddonCents(raw: unknown): number {
  return parseStoredBookingJobDetails(raw).reduce(
    (sum, job) =>
      sum + job.selectedAddOns.reduce((s, a) => s + a.priceCents, 0),
    0
  );
}

/**
 * Flatten per-job add-ons for top-level `addon_details` / Complete-sheet math.
 * Returns [] when there are none.
 */
export function flattenJobDetailsAddOns(raw: unknown): AddOnAtBooking[] {
  return parseStoredBookingJobDetails(raw).flatMap(job => job.selectedAddOns);
}
