import { isValidEmail } from '@/features/auth/utils/validation';
import { CUSTOMER_NOTE_MAX_LENGTH } from '@/features/customer-management/utils/parseCreateCustomerBody';
import type { CustomerFormData } from '../types';

export const BOOKING_CUSTOMER_EMAIL_MAX = 254;
export const BOOKING_CUSTOMER_FULL_NAME_MAX = 120;
export const BOOKING_CUSTOMER_STREET_MAX = 200;
export const BOOKING_CUSTOMER_CITY_MAX = 100;
export const BOOKING_CUSTOMER_UNIT_MAX = 50;
export const BOOKING_CUSTOMER_NOTES_MAX = CUSTOMER_NOTE_MAX_LENGTH;
export const BOOKING_VEHICLE_MAKE_MAX = 80;
export const BOOKING_VEHICLE_MODEL_MAX = 80;

/** US ZIP: 5 digits, or ZIP+4 as 9 digits (no hyphen). */
export function sanitizeUsZipInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 9);
}

export function isValidUsZipDigits(zip: string): boolean {
  const z = zip.trim();
  return /^\d{5}$/.test(z) || /^\d{9}$/.test(z);
}

export function sanitizeVehicleYearInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function isValidVehicleYearFourDigit(year: string): boolean {
  if (!/^\d{4}$/.test(year)) return false;
  const y = Number(year);
  const maxY = new Date().getFullYear() + 1;
  return y >= 1900 && y <= maxY;
}

function strField(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Coerce JSON body fields to `CustomerFormData` (missing keys → empty string). */
export function coerceCustomerFormData(raw: unknown): CustomerFormData {
  const r =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    fullName: strField(r.fullName),
    email: strField(r.email),
    phone: strField(r.phone),
    streetAddress: strField(r.streetAddress),
    unitApt: strField(r.unitApt),
    city: strField(r.city),
    state: strField(r.state),
    zip: strField(r.zip),
    vehicleYear: strField(r.vehicleYear),
    vehicleMake: strField(r.vehicleMake),
    vehicleModel: strField(r.vehicleModel),
    notes: strField(r.notes),
  };
}

/**
 * Server-side validation for public booking customer payloads.
 * Returns an English error message for the API, or null if valid.
 */
export function bookingCustomerPayloadErrorMessage(
  c: CustomerFormData
): string | null {
  const name = c.fullName.trim();
  if (!name) return 'Customer name is required';
  if (name.length > BOOKING_CUSTOMER_FULL_NAME_MAX)
    return 'Customer name is too long';

  const emailTrim = c.email.trim();
  if (emailTrim.length > BOOKING_CUSTOMER_EMAIL_MAX)
    return 'Email address is too long';
  if (emailTrim && !isValidEmail(emailTrim)) {
    return 'Please enter a valid email address';
  }

  if (!c.phone?.trim()) return 'Phone is required';
  const street = c.streetAddress?.trim() ?? '';
  if (!street) return 'Street address is required';
  if (street.length > BOOKING_CUSTOMER_STREET_MAX)
    return 'Street address is too long';

  const unit = (c.unitApt ?? '').trim();
  if (unit.length > BOOKING_CUSTOMER_UNIT_MAX)
    return 'Unit / apartment line is too long';

  const city = c.city?.trim() ?? '';
  if (!city) return 'City is required';
  if (city.length > BOOKING_CUSTOMER_CITY_MAX) return 'City is too long';

  if (!c.state?.trim()) return 'State is required';

  const zipDigits = sanitizeUsZipInput(c.zip ?? '');
  if (!isValidUsZipDigits(zipDigits)) {
    return 'Please enter a valid US ZIP code (5 digits, or 9 digits for ZIP+4).';
  }

  const notes = c.notes ?? '';
  if (notes.length > BOOKING_CUSTOMER_NOTES_MAX) {
    return `Notes cannot exceed ${BOOKING_CUSTOMER_NOTES_MAX} characters`;
  }

  const vy = (c.vehicleYear ?? '').trim();
  const vmk = (c.vehicleMake ?? '').trim();
  const vmd = (c.vehicleModel ?? '').trim();
  const anyVehicle = vy.length > 0 || vmk.length > 0 || vmd.length > 0;
  if (anyVehicle) {
    if (!vy || !vmk || !vmd) {
      return 'Vehicle year, make, and model are required';
    }
    if (!isValidVehicleYearFourDigit(vy)) {
      return 'Please enter a valid 4-digit vehicle year';
    }
    if (vmk.length > BOOKING_VEHICLE_MAKE_MAX) {
      return 'Vehicle make is too long';
    }
    if (vmd.length > BOOKING_VEHICLE_MODEL_MAX) {
      return 'Vehicle model is too long';
    }
  }

  return null;
}

/** Apply trims and ZIP normalization after validation passes. */
export function normalizeBookingCustomerInput(
  c: CustomerFormData
): CustomerFormData {
  return {
    ...c,
    fullName: c.fullName.trim(),
    email: c.email.trim(),
    phone: c.phone.trim(),
    streetAddress: c.streetAddress.trim(),
    unitApt: c.unitApt.trim(),
    city: c.city.trim(),
    state: c.state.trim().toUpperCase().slice(0, 2),
    zip: sanitizeUsZipInput(c.zip),
    vehicleYear: sanitizeVehicleYearInput(c.vehicleYear),
    vehicleMake: c.vehicleMake.trim(),
    vehicleModel: c.vehicleModel.trim(),
    notes: c.notes.trim(),
  };
}
