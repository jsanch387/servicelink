/**
 * Types for Availability Booking dashboard (V2) – owner view.
 * UI / mock only. Kept separate from request booking.
 */

export type AvailabilityBookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface AvailabilityBookingAddress {
  street: string;
  unitApt?: string;
  city: string;
  state: string;
  zip: string;
}

export interface AddOnAtBookingDisplay {
  id: string;
  name: string;
  priceCents: number;
}

export interface BookingPaymentSummaryDisplay {
  paymentStatus: string;
  /** `pay_now` (card), `pay_in_person`, or `none` (no in-app card charge). */
  paymentMethodSelected: string;
  currency: string;
  totalAmountCents: number;
  paidOnlineAmountCents: number;
  remainingAmountCents: number;
}

export interface AvailabilityBookingDisplay {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerVehicleYear?: string;
  customerVehicleMake?: string;
  customerVehicleModel?: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePriceCents: number | null;
  /** Add-ons selected at booking time. */
  addonDetails: AddOnAtBookingDisplay[];
  date: string;
  time: string;
  /** Local wall start `HH:mm` (00/30) for slot generation and reschedule APIs. */
  startTimeHHmm: string;
  status: AvailabilityBookingStatus;
  address: AvailabilityBookingAddress;
  notes: string;
  createdAt: string;
  /** Present when booking has payment summary data. */
  payment?: BookingPaymentSummaryDisplay | null;
}
