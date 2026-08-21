/**
 * Session cart for public multi-job booking (one visit, N catalog jobs).
 * Survives service-picker ↔ details ↔ calendar navigation for a single tab.
 */

import { PUBLIC_BOOKING_MAX_JOBS } from '../constants/publicBookingJobs';
import type {
  CustomerFormData,
  PublicBookingJobDraft,
  PublicBookingJobVehicleDraft,
} from '../types';

export type {
  PublicBookingJobDraft,
  PublicBookingJobVehicleDraft,
} from '../types';

export type PublicBookingVisitFlowStep =
  | 'location'
  | 'schedule'
  | 'details'
  | 'review'
  | 'payment';

export type PublicBookingVisitDetailsSubStep = 'contact' | 'vehicleNotes';

/** Form + schedule snapshot so add-another / cancel doesn’t wipe progress. */
export type PublicBookingVisitDraft = {
  customerData: CustomerFormData;
  selectedDateIso: string | null;
  /** Preferred local calendar day `YYYY-MM-DD` (avoids ISO timezone shifts). */
  selectedDateYmd?: string | null;
  selectedTime: string | null;
  step: PublicBookingVisitFlowStep;
  detailsSubStep: PublicBookingVisitDetailsSubStep;
  customerServiceChoice: 'mobile' | 'shop' | null;
  agreedToNotifications: boolean;
};

export type PublicBookingJobsCartV1 = {
  v: 1;
  savedAt: number;
  businessSlug: string;
  /** Visit-level location when business offers both. */
  serviceLocationType?: 'mobile' | 'shop';
  jobs: PublicBookingJobDraft[];
  visitDraft?: PublicBookingVisitDraft;
};

const STORAGE_PREFIX = 'servicelink.publicBookingJobsCart.v1:';

export function publicBookingJobsCartStorageKey(businessSlug: string): string {
  return `${STORAGE_PREFIX}${businessSlug.trim()}`;
}

function isVehicleDraft(v: unknown): v is PublicBookingJobVehicleDraft {
  if (v == null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.year === 'string' &&
    typeof o.make === 'string' &&
    typeof o.model === 'string'
  );
}

function isJobDraft(raw: unknown): raw is PublicBookingJobDraft {
  if (raw == null || typeof raw !== 'object') return false;
  const j = raw as Record<string, unknown>;
  return (
    typeof j.localId === 'string' &&
    typeof j.serviceId === 'string' &&
    j.serviceId.trim().length > 0 &&
    typeof j.serviceName === 'string' &&
    j.serviceName.trim().length > 0 &&
    (j.servicePriceOptionLabel === null ||
      typeof j.servicePriceOptionLabel === 'string') &&
    typeof j.servicePriceCents === 'number' &&
    Number.isFinite(j.servicePriceCents) &&
    typeof j.durationMinutes === 'number' &&
    Number.isFinite(j.durationMinutes) &&
    j.durationMinutes >= 1 &&
    Array.isArray(j.selectedAddOns) &&
    isVehicleDraft(j.vehicle)
  );
}

export function loadPublicBookingJobsCart(
  businessSlug: string
): PublicBookingJobsCartV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(
      publicBookingJobsCartStorageKey(businessSlug)
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicBookingJobsCartV1;
    if (parsed?.v !== 1) return null;
    if (typeof parsed.savedAt !== 'number') return null;
    if (parsed.businessSlug !== businessSlug.trim()) return null;
    if (!Array.isArray(parsed.jobs) || parsed.jobs.length < 1) return null;
    if (parsed.jobs.length > PUBLIC_BOOKING_MAX_JOBS) return null;
    if (!parsed.jobs.every(isJobDraft)) return null;
    const serviceLocationType =
      parsed.serviceLocationType === 'mobile' ||
      parsed.serviceLocationType === 'shop'
        ? parsed.serviceLocationType
        : undefined;
    return {
      v: 1,
      savedAt: parsed.savedAt,
      businessSlug: parsed.businessSlug,
      serviceLocationType,
      jobs: parsed.jobs,
      visitDraft: parseCartVisitDraft(parsed.visitDraft),
    };
  } catch {
    return null;
  }
}

function parseCartVisitDraft(
  raw: unknown
): PublicBookingVisitDraft | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const d = raw as Record<string, unknown>;
  const customer = d.customerData;
  if (customer == null || typeof customer !== 'object') return undefined;
  const c = customer as Record<string, unknown>;
  if (typeof c.fullName !== 'string' || typeof c.phone !== 'string') {
    return undefined;
  }
  const step = d.step;
  if (
    step !== 'location' &&
    step !== 'schedule' &&
    step !== 'details' &&
    step !== 'review' &&
    step !== 'payment'
  ) {
    return undefined;
  }
  const rawDetailsSubStep = d.detailsSubStep;
  if (
    rawDetailsSubStep !== 'contact' &&
    rawDetailsSubStep !== 'address' &&
    rawDetailsSubStep !== 'vehicleNotes'
  ) {
    return undefined;
  }
  // Legacy sessionStorage drafts may still have the old separate 'address'
  // sub-step; it's now merged into 'contact'.
  const detailsSubStep: PublicBookingVisitDetailsSubStep =
    rawDetailsSubStep === 'address' ? 'contact' : rawDetailsSubStep;
  const choice = d.customerServiceChoice;
  return {
    customerData: {
      fullName: String(c.fullName ?? ''),
      email: String(c.email ?? ''),
      phone: String(c.phone ?? ''),
      streetAddress: String(c.streetAddress ?? ''),
      unitApt: String(c.unitApt ?? ''),
      city: String(c.city ?? ''),
      state: String(c.state ?? ''),
      zip: String(c.zip ?? ''),
      vehicleYear: String(c.vehicleYear ?? ''),
      vehicleMake: String(c.vehicleMake ?? ''),
      vehicleModel: String(c.vehicleModel ?? ''),
      petName: String(c.petName ?? ''),
      petSpecies: String(c.petSpecies ?? ''),
      petBreed: String(c.petBreed ?? ''),
      petSize: String(c.petSize ?? ''),
      notes: String(c.notes ?? ''),
    },
    selectedDateIso:
      typeof d.selectedDateIso === 'string' ? d.selectedDateIso : null,
    selectedDateYmd:
      typeof d.selectedDateYmd === 'string' ? d.selectedDateYmd : null,
    selectedTime: typeof d.selectedTime === 'string' ? d.selectedTime : null,
    step,
    detailsSubStep,
    customerServiceChoice:
      choice === 'mobile' || choice === 'shop' ? choice : null,
    agreedToNotifications: d.agreedToNotifications === true,
  };
}

export function savePublicBookingJobsCart(
  cart: PublicBookingJobsCartV1
): boolean {
  if (typeof window === 'undefined') return false;
  if (cart.jobs.length < 1 || cart.jobs.length > PUBLIC_BOOKING_MAX_JOBS) {
    return false;
  }
  try {
    sessionStorage.setItem(
      publicBookingJobsCartStorageKey(cart.businessSlug),
      JSON.stringify({ ...cart, savedAt: Date.now() })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearPublicBookingJobsCart(businessSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(publicBookingJobsCartStorageKey(businessSlug));
  } catch {
    // ignore
  }
}

export function createPublicBookingJobLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export type AppendPublicBookingJobResult =
  | { ok: true; cart: PublicBookingJobsCartV1 }
  | { ok: false; reason: 'max_jobs' | 'save_failed' };

/**
 * Append a configured catalog job to the visit cart (or create the cart).
 */
function buildPublicBookingJobDraft(
  job: Omit<PublicBookingJobDraft, 'localId'> & { localId?: string },
  fallbackLocalId?: string
): PublicBookingJobDraft {
  return {
    localId:
      job.localId?.trim() ||
      fallbackLocalId?.trim() ||
      createPublicBookingJobLocalId(),
    serviceId: job.serviceId.trim(),
    serviceName: job.serviceName.trim(),
    servicePriceOptionLabel: job.servicePriceOptionLabel?.trim() || null,
    servicePriceCents: Math.max(0, Math.round(job.servicePriceCents)),
    selectedAddOns: job.selectedAddOns.map(a => ({
      id: a.id,
      name: a.name,
      priceCents: Math.max(0, Math.round(a.priceCents)),
      durationMinutes:
        a.durationMinutes != null && a.durationMinutes > 0
          ? Math.round(a.durationMinutes)
          : undefined,
    })),
    durationMinutes: Math.max(1, Math.round(job.durationMinutes)),
    vehicle: {
      year: job.vehicle.year.trim(),
      make: job.vehicle.make.trim(),
      model: job.vehicle.model.trim(),
    },
    pet: {
      name: job.pet?.name.trim() ?? '',
      species: job.pet?.species.trim() ?? '',
      breed: job.pet?.breed.trim() ?? '',
      size: job.pet?.size.trim() ?? '',
    },
  };
}

export function appendPublicBookingJob(args: {
  businessSlug: string;
  job: Omit<PublicBookingJobDraft, 'localId'> & { localId?: string };
  serviceLocationType?: 'mobile' | 'shop';
}): AppendPublicBookingJobResult {
  const slug = args.businessSlug.trim();
  const existing = loadPublicBookingJobsCart(slug);
  const jobs = existing?.jobs ?? [];
  if (jobs.length >= PUBLIC_BOOKING_MAX_JOBS) {
    return { ok: false, reason: 'max_jobs' };
  }
  const nextJob = buildPublicBookingJobDraft(args.job);
  const serviceLocationType =
    args.serviceLocationType ?? existing?.serviceLocationType;
  const cart: PublicBookingJobsCartV1 = {
    v: 1,
    savedAt: Date.now(),
    businessSlug: slug,
    serviceLocationType,
    jobs: [...jobs, nextJob],
    visitDraft: existing?.visitDraft,
  };
  if (!savePublicBookingJobsCart(cart)) {
    return { ok: false, reason: 'save_failed' };
  }
  return { ok: true, cart };
}

/**
 * Replace the visit's jobs with a single reconfigured job while keeping
 * contact/schedule `visitDraft` (edit-the-only-service path).
 */
export function replacePublicBookingVisitJob(args: {
  businessSlug: string;
  job: Omit<PublicBookingJobDraft, 'localId'> & { localId?: string };
  serviceLocationType?: 'mobile' | 'shop';
}): AppendPublicBookingJobResult {
  const slug = args.businessSlug.trim();
  const existing = loadPublicBookingJobsCart(slug);
  const priorLocalId = existing?.jobs[0]?.localId;
  const nextJob = buildPublicBookingJobDraft(args.job, priorLocalId);
  const cart: PublicBookingJobsCartV1 = {
    v: 1,
    savedAt: Date.now(),
    businessSlug: slug,
    serviceLocationType:
      args.serviceLocationType ?? existing?.serviceLocationType,
    jobs: [nextJob],
    visitDraft: existing?.visitDraft,
  };
  if (!savePublicBookingJobsCart(cart)) {
    return { ok: false, reason: 'save_failed' };
  }
  return { ok: true, cart };
}

export function removePublicBookingJob(
  businessSlug: string,
  localId: string
): PublicBookingJobsCartV1 | null {
  const existing = loadPublicBookingJobsCart(businessSlug);
  if (!existing) return null;
  const jobs = existing.jobs.filter(j => j.localId !== localId);
  if (jobs.length === 0) {
    clearPublicBookingJobsCart(businessSlug);
    return null;
  }
  const cart: PublicBookingJobsCartV1 = {
    ...existing,
    jobs,
    savedAt: Date.now(),
  };
  savePublicBookingJobsCart(cart);
  return cart;
}

export function sumPublicBookingJobsDurationMinutes(
  jobs: PublicBookingJobDraft[]
): number {
  return jobs.reduce((sum, j) => sum + j.durationMinutes, 0);
}

export function sumPublicBookingJobsGrossCents(
  jobs: PublicBookingJobDraft[]
): number {
  return jobs.reduce((sum, j) => {
    const addOns = j.selectedAddOns.reduce((s, a) => s + a.priceCents, 0);
    return sum + j.servicePriceCents + addOns;
  }, 0);
}

export function publicBookingJobDisplayName(
  job: PublicBookingJobDraft
): string {
  const label = job.servicePriceOptionLabel?.trim();
  return label ? `${job.serviceName} — ${label}` : job.serviceName;
}

export function publicBookingVisitServiceNameSummary(
  jobs: PublicBookingJobDraft[]
): string {
  if (jobs.length === 0) return 'Service';
  if (jobs.length === 1) return publicBookingJobDisplayName(jobs[0]);
  const first = publicBookingJobDisplayName(jobs[0]);
  return `${first} + ${jobs.length - 1} more`;
}

export function persistPublicBookingJobsCartJobs(
  businessSlug: string,
  jobs: PublicBookingJobDraft[],
  serviceLocationType?: 'mobile' | 'shop'
): boolean {
  if (jobs.length < 1) {
    clearPublicBookingJobsCart(businessSlug);
    return false;
  }
  const existing = loadPublicBookingJobsCart(businessSlug);
  return savePublicBookingJobsCart({
    v: 1,
    savedAt: Date.now(),
    businessSlug: businessSlug.trim(),
    serviceLocationType: serviceLocationType ?? existing?.serviceLocationType,
    jobs,
    visitDraft: existing?.visitDraft,
  });
}

export function savePublicBookingVisitDraftOnCart(
  businessSlug: string,
  visitDraft: PublicBookingVisitDraft
): boolean {
  const existing = loadPublicBookingJobsCart(businessSlug);
  if (!existing) return false;
  return savePublicBookingJobsCart({
    ...existing,
    visitDraft,
    savedAt: Date.now(),
  });
}
