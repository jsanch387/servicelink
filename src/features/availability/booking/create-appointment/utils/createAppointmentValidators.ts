import { isValidEmail } from '@/features/auth/utils/validation';
import {
  BOOKING_CUSTOMER_CITY_MAX,
  BOOKING_CUSTOMER_EMAIL_MAX,
  BOOKING_CUSTOMER_FULL_NAME_MAX,
  BOOKING_CUSTOMER_STREET_MAX,
  BOOKING_CUSTOMER_UNIT_MAX,
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  isValidUsZipDigits,
  isValidVehicleYearFourDigit,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import type {
  CreateAppointmentAddress,
  CreateAppointmentCustomer,
  CreateAppointmentLocationType,
  CreateAppointmentVehicle,
} from '../types';

/** Customer step: name + US 10-digit phone; email optional but valid if present. */
export function isCustomerStepComplete(
  customer: CreateAppointmentCustomer | null | undefined
): boolean {
  const c = customer ?? { fullName: '', phone: '', email: '' };
  const fullName = c.fullName.trim();
  if (!fullName || fullName.length > BOOKING_CUSTOMER_FULL_NAME_MAX) {
    return false;
  }
  const emailTrim = c.email.trim();
  if (
    emailTrim &&
    (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX || !isValidEmail(emailTrim))
  ) {
    return false;
  }
  const phoneDigits = c.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) return false;
  return true;
}

/** Address step: street, city, 2-letter state, 5-digit ZIP (unit optional). */
export function isAddressStepComplete(
  address: CreateAppointmentAddress | null | undefined
): boolean {
  const a = address ?? {
    street: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
  };
  const street = a.street.trim();
  const unit = a.unit.trim();
  const city = a.city.trim();
  return Boolean(
    street &&
      street.length <= BOOKING_CUSTOMER_STREET_MAX &&
      unit.length <= BOOKING_CUSTOMER_UNIT_MAX &&
      city &&
      city.length <= BOOKING_CUSTOMER_CITY_MAX &&
      /^[A-Za-z]{2}$/.test(a.state.trim()) &&
      isValidUsZipDigits(a.zip)
  );
}

/**
 * Vehicle is optional (boats, powersports, etc.).
 * If any field is filled, year + make + model are all required.
 */
export function isVehicleStepComplete(
  vehicle: CreateAppointmentVehicle | null | undefined
): boolean {
  const v = vehicle ?? { year: '', make: '', model: '' };
  const year = v.year.trim();
  const make = v.make.trim();
  const model = v.model.trim();
  const any = year.length > 0 || make.length > 0 || model.length > 0;
  if (!any) return true;
  if (!isValidVehicleYearFourDigit(year)) return false;
  if (!make || make.length > BOOKING_VEHICLE_MAKE_MAX) return false;
  if (!model || model.length > BOOKING_VEHICLE_MODEL_MAX) return false;
  return true;
}

export function isLocationStepComplete(
  locationType: CreateAppointmentLocationType | null | undefined
): boolean {
  return locationType === 'mobile' || locationType === 'shop';
}

export function isReviewVisitFieldsComplete(p: {
  selectedDateKey: string | null;
  selectedTime: string | null;
  customer: CreateAppointmentCustomer;
  appointmentLocationType?: CreateAppointmentLocationType | null;
  locationSkipped?: boolean;
  addressSkipped?: boolean;
  address: CreateAppointmentAddress;
}): boolean {
  return Boolean(
    p.selectedDateKey &&
      p.selectedTime &&
      isCustomerStepComplete(p.customer) &&
      (p.locationSkipped ||
        isLocationStepComplete(p.appointmentLocationType)) &&
      (p.addressSkipped || isAddressStepComplete(p.address))
  );
}

export function parseRequiredCustomJobPriceCents(
  value: string | null | undefined
): number | null {
  const raw = String(value ?? '')
    .replace(/\$/g, '')
    .trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const dollars = Number.parseInt(raw, 10);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return dollars * 100;
}

/** Custom job pricing step: name, price digits, and duration on the 30m grid. */
export function isCustomJobPricingComplete(p: {
  serviceName?: string;
  customPriceLabel?: string;
  durationMinutes?: number;
}): boolean {
  const nameOk = Boolean(p.serviceName?.trim());
  const priceOk = parseRequiredCustomJobPriceCents(p.customPriceLabel) != null;
  const durationOk =
    typeof p.durationMinutes === 'number' && p.durationMinutes > 0;
  return nameOk && priceOk && durationOk;
}
