import { isValidEmail } from '@/features/auth/utils/validation';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import type { CustomerAddress } from '@/features/customer-management/types';
import {
  CUSTOMER_NOTE_MAX_LENGTH,
  INVALID_US_PHONE_MESSAGE,
} from '@/features/customer-management/utils/parseCreateCustomerBody';
import { US_PHONE_DIGIT_COUNT } from '@/lib/formatUsPhone';

export function parseCustomerPhoneField(
  phone: string
): { ok: true; phone: string } | { ok: false; error: string } {
  const phoneNormalized = normalizePhoneForLookup(phone);
  if (!phoneNormalized || phoneNormalized.length !== US_PHONE_DIGIT_COUNT) {
    return { ok: false, error: INVALID_US_PHONE_MESSAGE };
  }
  return { ok: true, phone: phoneNormalized };
}

export function parseCustomerEmailField(
  email: string
): { ok: true; email: string } | { ok: false; error: string } {
  const emailRaw = email.trim();
  if (!emailRaw || !isValidEmail(emailRaw)) {
    return { ok: false, error: 'Please enter a valid email address' };
  }
  return { ok: true, email: normalizeEmailForLookup(emailRaw) };
}

export function parseCustomerAddressFields(input: {
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
}): { ok: true; address: CustomerAddress } | { ok: false; error: string } {
  const street = input.street.trim();
  const unit = input.unit.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  const zip = input.zip.trim();

  if (!street) return { ok: false, error: 'Street is required.' };
  if (street.length > 120) return { ok: false, error: 'Street is too long.' };
  if (unit.length > 50) return { ok: false, error: 'Unit is too long.' };
  if (!city) return { ok: false, error: 'City is required.' };
  if (city.length > 80) return { ok: false, error: 'City is too long.' };
  if (!/^[A-Z]{2}$/.test(state)) {
    return { ok: false, error: 'Enter a 2-letter state.' };
  }
  if (!/^\d{5}$/.test(zip)) {
    return { ok: false, error: 'Enter a valid 5-digit ZIP code.' };
  }

  return { ok: true, address: { street, unit, city, state, zip } };
}

export const CUSTOMER_NAME_MAX_LENGTH = 120;

export type CustomerProfileInput = {
  name: string;
  phone: string;
  email: string;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  note: string;
};

export type ParsedCustomerProfile = {
  fullName: string;
  phone: string | null;
  email: string | null;
  address: CustomerAddress | null;
  note: string;
};

/** Edit form: name is required. Phone, email, and address can be cleared. */
export function parseCustomerProfileFields(
  input: CustomerProfileInput
): { ok: true; profile: ParsedCustomerProfile } | { ok: false; error: string } {
  const fullName = input.name.trim();
  if (!fullName) return { ok: false, error: 'Name is required' };
  if (fullName.length > CUSTOMER_NAME_MAX_LENGTH) {
    return { ok: false, error: 'Name is too long.' };
  }

  const phoneNormalized = normalizePhoneForLookup(input.phone);
  if (
    phoneNormalized !== null &&
    phoneNormalized.length !== US_PHONE_DIGIT_COUNT
  ) {
    return { ok: false, error: INVALID_US_PHONE_MESSAGE };
  }

  const emailRaw = input.email.trim();
  let email: string | null = null;
  if (emailRaw) {
    if (!isValidEmail(emailRaw)) {
      return { ok: false, error: 'Please enter a valid email address' };
    }
    email = normalizeEmailForLookup(emailRaw);
  }

  const street = input.street.trim();
  const unit = input.unit.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const zip = input.zip.trim();
  const addressTouched = Boolean(street || unit || city || state || zip);
  let address: CustomerAddress | null = null;
  if (addressTouched) {
    const parsed = parseCustomerAddressFields({
      street,
      unit,
      city,
      state,
      zip,
    });
    if (!parsed.ok) return parsed;
    address = parsed.address;
  }

  const note = input.note.trim();
  if (note.length > CUSTOMER_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Notes cannot exceed ${CUSTOMER_NOTE_MAX_LENGTH} characters`,
    };
  }

  return {
    ok: true,
    profile: {
      fullName,
      phone: phoneNormalized,
      email,
      address,
      note,
    },
  };
}

export function formatCustomerAddress(
  address: CustomerAddress | null | undefined
): string {
  if (!address) return '';
  const streetLine = [address.street, address.unit].filter(Boolean).join(', ');
  const cityLine = [
    address.city,
    [address.state, address.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  return [streetLine, cityLine].filter(Boolean).join('\n');
}
