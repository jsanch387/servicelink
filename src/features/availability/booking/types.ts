/**
 * Availability Booking (customer flow) – types.
 * POC: UI and mock data only.
 */

import type { PublicBookingFlowLocale } from '@/constants/routes';
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
  notes: string;
}

export interface ExistingBooking {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
}

/** Calendar date + local wall times for owner time-off (slot + API overlap checks). */
export interface TimeOffInterval {
  date: string;
  startTime: string;
  endTime: string;
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
  serviceId?: string;
  /** Comma-separated add-on IDs from service details page. */
  addOnIds?: string;
  /** Resolved add-on objects from server (preferred over addOnIds). */
  selectedAddOns?: AddOnDisplay[];
  serviceName: string;
  serviceDurationMinutes?: number;
  servicePriceCents?: number;
  /** Shown under the service name when customer chose a multi-price option. */
  selectedPriceOptionLabel?: string;
  /** Owner availability from DB. */
  weeklySchedule: WeeklySchedule;
  /** Owner time-off blocks for that day range (from `time_off_blocks`). */
  timeOffBlocks?: TimeOffInterval[];
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
   * When set, schedule-step back uses this instead of a full navigation to
   * `exitCalendarFlowHref` (keeps configure + calendar in one client shell).
   */
  onExitScheduleStep?: () => void;
  /**
   * How many configure sub-steps (price / add-ons) exist for this service.
   * Pass from `PublicBookingConfigureScheduleFunnel` so the progress bar matches
   * configure + calendar as one journey; default `0` (customer opened `/book` directly).
   */
  bookingFlowConfigurePhaseCount?: number;
  /**
   * When Stripe redirects with `?checkout=success&session_id=…`, the server passes
   * the session id so the client can show a confirmation placeholder immediately
   * instead of flashing the calendar before `useSearchParams` + fetch settle.
   */
  stripeCheckoutSessionId?: string | null;
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

/** Payload for POST /api/public/bookings (client → API). */
export interface CreateBookingRequest {
  businessSlug: string;
  businessId: string;
  serviceId?: string;
  serviceName: string;
  /** When set, appended to stored/display service name (multi-price option). */
  servicePriceOptionLabel?: string;
  servicePriceCents?: number;
  /** Add-ons selected by customer (stored with booking, shown in emails/dashboard). */
  selectedAddOns?: AddOnAtBooking[];
  durationMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  customer: CustomerFormData;
  /**
   * When checkout mode is `customer_choice` and the customer confirms without
   * Stripe (e.g. pay in person), the client sends `pay_in_person`. Otherwise omit.
   */
  paymentMethodSelected?: 'pay_now' | 'pay_in_person' | 'none';
  /**
   * Dashboard owner booking on behalf of a customer (`for=owner`). Requires an
   * authenticated session for this business; customer email may be omitted.
   */
  ownerManualBooking?: boolean;
}
