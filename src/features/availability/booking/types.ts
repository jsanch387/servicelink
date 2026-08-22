/**
 * Availability Booking (customer flow) – types.
 * POC: UI and mock data only.
 */

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import type { WeeklySchedule } from '../types/availability';

export interface ServiceSummary {
  name: string;
  durationMinutes: number;
  priceCents?: number;
}

export interface CustomerFormData {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zip: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petSize: string;
  notes: string;
}

export interface ExistingBooking {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
}

/** Calendar date range + local wall times for owner time-off (slot + API overlap). */
export interface TimeOffInterval {
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  /**
   * Legacy single-day field. When present without start/end, treated as both.
   * Prefer `startDate` / `endDate`.
   */
  date?: string;
}

export interface AddOnDisplay {
  id: string;
  name: string;
  priceCents: number;
  /** Extra time this add-on adds; omit or null = none. */
  durationMinutes?: number | null;
}

export interface PublicBookingPaymentSettings {
  paymentsEnabled: boolean;
  checkoutMode: CheckoutPaymentMode | null;
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  depositValue: number;
  currency: string;
}

export interface AvailabilityBookingPageProps {
  businessName: string;
  businessId: string;
  businessSlug: string;
  /** When true, booking details form includes vehicle year/make/model. */
  showVehicleFields?: boolean;
  /** When true, booking details form includes pet name/species/breed/size. */
  showPetFields?: boolean;
  serviceId?: string;
  /** Comma-separated add-on IDs from service details page. */
  addOnIds?: string;
  /** Resolved add-on objects from server (preferred over addOnIds). */
  selectedAddOns?: AddOnDisplay[];
  serviceName: string;
  serviceDurationMinutes?: number;
  /** Owner custom job notes used to prefill the booking notes field. */
  initialCustomerNotes?: string;
  servicePriceCents?: number;
  /** Shown under the service name when customer chose a multi-price option. */
  selectedPriceOptionLabel?: string;
  /** Owner availability from DB. */
  weeklySchedule: WeeklySchedule;
  /** Owner time-off blocks for that day range (from `time_off_blocks`). */
  timeOffBlocks?: TimeOffInterval[];
  /**
   * Lead time from `business_availability.minimum_notice`.
   * Ignored for owner manual bookings (treated as `'none'`).
   */
  minimumNotice?: string;
  /** Fetched from API when businessSlug is set; omit to use [] or fetch internally. */
  existingBookings?: ExistingBooking[];
  /** Dashboard owner flow (`for=owner`); changes confirmation copy and CTA. */
  isOwnerManualBooking?: boolean;
  /** Public funnel locale (`?lang=` + cookie). UI chrome only — not service copy. */
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Public payment behavior configured by business owner. */
  paymentSettings?: PublicBookingPaymentSettings | null;
  /**
   * Step 1 top back: leave `/book` toward service details / profile / dashboard
   * (same target the book page header used before inline steps).
   */
  exitCalendarFlowHref: string;
  exitCalendarFlowLabel: string;
  /**
   * When Stripe redirects with `?checkout=success&session_id=…`, the server passes
   * the session id so the client can show a confirmation placeholder immediately
   * instead of flashing the calendar before `useSearchParams` + fetch settle.
   */
  stripeCheckoutSessionId?: string | null;
  /** Business mobile / shop / both + resolved shop address for public booking. */
  serviceLocation: PublicBookingServiceLocation;
  /**
   * When the business offers both, choice is made on `/book/details` (or a
   * pre-schedule step for custom owner jobs) and passed here.
   */
  initialCustomerServiceChoice?: 'mobile' | 'shop' | null;
  /** Live sale for this business (Pro only); auto-applies when appointment date qualifies. */
  activeSale?: PublicActiveSale | null;
  /**
   * Public multi-job visit (`/book?visit=1`). When set, price/duration/submit use
   * `jobs[]` instead of the single-service URL fields.
   */
  bookingJobs?: PublicBookingJobDraft[];
  /** Link to service picker to append another job (public multi-job only). */
  addAnotherJobHref?: string;
  onRemoveBookingJob?: (localId: string) => void;
  onBookingJobsChange?: (jobs: PublicBookingJobDraft[]) => void;
  /** Clears the visit cart after a successful public multi-job create. */
  onPublicMultiJobBookingCreated?: () => void;
}

export interface BookingSubmission {
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  customer: CustomerFormData;
}

/** Add-on at booking time (denormalized for storage/emails). */
export interface AddOnAtBooking {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
}

/** Per-job vehicle draft for public multi-job cart. */
export type PublicBookingJobVehicleDraft = {
  year: string;
  make: string;
  model: string;
};

/** Per-job pet draft for public multi-job cart. */
export type PublicBookingJobPetDraft = {
  name: string;
  species: string;
  breed: string;
  size: string;
};

/**
 * One catalog job in the public visit cart (sessionStorage → `jobs[]` on create).
 */
export type PublicBookingJobDraft = {
  localId: string;
  serviceId: string;
  serviceName: string;
  servicePriceOptionLabel: string | null;
  servicePriceCents: number;
  selectedAddOns: AddOnAtBooking[];
  durationMinutes: number;
  vehicle: PublicBookingJobVehicleDraft;
  pet?: PublicBookingJobPetDraft;
};

/** Per-job vehicle for owner multi-job visits (`jobs[]`). */
export interface CreateBookingJobVehicle {
  year?: string;
  make?: string;
  model?: string;
}

export interface CreateBookingJobPet {
  name?: string;
  species?: string;
  breed?: string;
  size?: string;
}

/**
 * One job inside an owner multi-job visit (`jobs[]` on CreateBookingRequest).
 * Visit-level who/where/when live on the parent request.
 */
export interface CreateBookingJobItem {
  serviceName: string;
  /** Catalog service id. Omit / null for a custom job. */
  serviceId?: string | null;
  servicePriceOptionLabel?: string | null;
  /** Owner-edited price wins (integer cents ≥ 0). */
  servicePriceCents: number;
  selectedAddOns?: AddOnAtBooking[];
  /** This job only (service + its add-ons). Integer ≥ 1. */
  durationMinutes: number;
  vehicle?: CreateBookingJobVehicle;
  pet?: CreateBookingJobPet;
  /** Mobile local id for support correlation — not persisted in v1. */
  clientJobId?: string;
  /** Optional sale preview fields — ignored; server recomputes. */
  discountSource?: 'sale';
  discountSaleId?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  subtotalCents?: number;
  discountCents?: number;
  discountLabel?: string;
}

/** Payload for POST /api/public/bookings (client → API). */
export interface CreateBookingRequest {
  businessSlug: string;
  businessId: string;
  serviceId?: string;
  /**
   * Legacy single-job: required when `jobs` is omitted.
   * Multi-job (`jobs` present): omit; use each `jobs[i].serviceName`.
   */
  serviceName?: string;
  /** When set, appended to stored/display service name (multi-price option). */
  servicePriceOptionLabel?: string;
  servicePriceCents?: number;
  /** Add-ons selected by customer (stored with booking, shown in emails/dashboard). */
  selectedAddOns?: AddOnAtBooking[];
  /**
   * Legacy single-job: required when `jobs` is omitted.
   * Multi-job: omit; visit duration = sum of job durations.
   */
  durationMinutes?: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm — visit arrival / first job start
  customer: CustomerFormData;
  /**
   * When checkout mode is `customer_choice` and the customer confirms without
   * Stripe (e.g. pay in person), the client sends `pay_in_person`. Otherwise omit.
   */
  paymentMethodSelected?: 'pay_now' | 'pay_in_person' | 'none' | 'membership';
  /**
   * Dashboard owner booking on behalf of a customer (`for=owner`). Requires an
   * authenticated session for this business; customer email may be omitted.
   */
  ownerManualBooking?: boolean;
  /**
   * Multi-job appointment (1…N). When present, creates **one** booking row with
   * jobs stored in `job_details`. Appointment duration = sum of job durations.
   * Owner: up to 20 (custom jobs allowed). Public: up to 4, catalog `serviceId` required.
   */
  jobs?: CreateBookingJobItem[];
  /** Required when business offers both mobile and shop (`service_location_mode = both`). */
  customerServiceLocation?: 'mobile' | 'shop';
  /**
   * Mobile owner manual booking: where service happens (`mobile` | `shop`).
   * Web may omit; use `customerServiceLocation` instead. Persisted as `bookings.service_location_type`.
   */
  serviceLocationType?: 'mobile' | 'shop';
  /** Optional promo code entered at checkout (uppercase letters/numbers). */
  promoCode?: string;
  /**
   * Owner/mobile Review preview only — **ignored by the server**.
   * Server recomputes the sale snapshot from DB for `scheduledDate`.
   * Promo is never applied when `ownerManualBooking` is true.
   */
  discountSource?: 'sale';
  discountSaleId?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  subtotalCents?: number;
  discountCents?: number;
  discountLabel?: string;
  /**
   * Owner create only. When `false`, skip auto-applied sale.
   * Omitted / `true` keeps current behavior (apply if the date qualifies).
   */
  applySale?: boolean;
  /**
   * Owner create from a membership subscriber: after booking succeeds, link
   * this appointment as the current billing-period visit.
   */
  membershipId?: string;
  /**
   * Public customers only: transactional SMS opt-in from the contact checkbox.
   * Default true when omitted on public create; owner manual should omit.
   */
  agreedToNotifications?: boolean;
}
