/**
 * Canonical booking line subtotal for Complete-sheet / list remaining / create checks.
 *
 * Rules (must match mobile BookingCompleteInvoiceDesignSheet):
 * - When `job_details` has jobs → sum those service prices + per-job add-ons
 *   (ignore incomplete top-level `service_price_cents`).
 * - Otherwise → top-level `service_price_cents` + `addon_details`.
 * - Never double-count add-ons from both places when jobs exist.
 */

import {
  parseStoredBookingJobDetails,
  sumJobDetailsAddonCents,
  sumJobDetailsServiceCents,
} from './parseStoredBookingJobDetails';

export interface BookingLineSubtotalInput {
  servicePriceCents?: number | null;
  addonDetails?: unknown;
  jobDetails?: unknown;
}

export interface BookingLineSubtotalResult {
  fromJobs: boolean;
  jobCount: number;
  serviceCents: number;
  addonCents: number;
  /** Service + add-ons only (no session fees, no discount). */
  lineSubtotalCents: number;
}

/** Flat array or `{ addons: [...] }` (legacy shape on some rows). */
export function sumTopLevelAddonDetailsCents(addonDetails: unknown): number {
  if (!addonDetails) return 0;
  const list = Array.isArray(addonDetails)
    ? addonDetails
    : typeof addonDetails === 'object' &&
        Array.isArray((addonDetails as { addons?: unknown }).addons)
      ? (addonDetails as { addons: unknown[] }).addons
      : null;
  if (!list) return 0;
  return list.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const cents = (item as { priceCents?: number }).priceCents;
    return sum + (typeof cents === 'number' && cents >= 0 ? cents : 0);
  }, 0);
}

export function resolveBookingLineSubtotalCents(
  input: BookingLineSubtotalInput
): BookingLineSubtotalResult {
  const jobs = parseStoredBookingJobDetails(input.jobDetails);
  if (jobs.length > 0) {
    const serviceCents = sumJobDetailsServiceCents(input.jobDetails);
    const addonCents = sumJobDetailsAddonCents(input.jobDetails);
    return {
      fromJobs: true,
      jobCount: jobs.length,
      serviceCents,
      addonCents,
      lineSubtotalCents: serviceCents + addonCents,
    };
  }

  const serviceCents =
    typeof input.servicePriceCents === 'number' &&
    Number.isFinite(input.servicePriceCents) &&
    input.servicePriceCents >= 0
      ? Math.round(input.servicePriceCents)
      : 0;
  const addonCents = sumTopLevelAddonDetailsCents(input.addonDetails);
  return {
    fromJobs: false,
    jobCount: 0,
    serviceCents,
    addonCents,
    lineSubtotalCents: serviceCents + addonCents,
  };
}

/**
 * Create-path denormalized columns that must stay aligned with `job_details`
 * so list/Complete never drift.
 */
export function appointmentMoneyFieldsFromJobs(
  jobs: Array<{
    servicePriceCents: number;
    selectedAddOns: Array<{ id: string; name: string; priceCents: number }>;
  }>
): {
  servicePriceCents: number;
  selectedAddOns: Array<{ id: string; name: string; priceCents: number }>;
  visitGrossCents: number;
} {
  const servicePriceCents = jobs.reduce(
    (sum, j) => sum + Math.max(0, Math.round(j.servicePriceCents)),
    0
  );
  const selectedAddOns = jobs.flatMap(j => j.selectedAddOns);
  const addonCents = selectedAddOns.reduce(
    (sum, a) => sum + Math.max(0, Math.round(a.priceCents)),
    0
  );
  return {
    servicePriceCents,
    selectedAddOns,
    visitGrossCents: servicePriceCents + addonCents,
  };
}
