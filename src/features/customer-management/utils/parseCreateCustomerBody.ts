import { isValidEmail } from '@/features/auth/utils/validation';
import {
  normalizeEmailForLookup,
  normalizePhoneForLookup,
} from '@/features/customer-management/server/normalizeCustomerContact';
import { US_PHONE_DIGIT_COUNT } from '@/lib/formatUsPhone';

export const INVALID_US_PHONE_MESSAGE =
  'Please enter a valid 10-digit US phone number, or leave phone blank.';

export const CUSTOMER_NOTE_MAX_LENGTH = 280;

export const DUPLICATE_CUSTOMER_MESSAGE =
  'A customer with this information already exists.';

export type ParsedCreateCustomerBody =
  | {
      ok: true;
      fullName: string;
      /** Digits-only phone or null */
      phone: string | null;
      /** Lowercase trimmed email or null */
      email: string | null;
      phoneNormalized: string | null;
      emailNormalized: string | null;
      notes: string | null;
    }
  | { ok: false; error: string };

/**
 * Validates JSON body for POST /api/customers (shared rules for API + optional client checks).
 */
export function parseCreateCustomerBody(
  body: unknown
): ParsedCreateCustomerBody {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const o = body as Record<string, unknown>;
  const fullName = typeof o.fullName === 'string' ? o.fullName.trim() : '';
  if (!fullName) {
    return { ok: false, error: 'Name is required' };
  }

  const emailRaw = typeof o.email === 'string' ? o.email.trim() : '';
  let emailNormalized: string | null = null;
  if (emailRaw) {
    if (!isValidEmail(emailRaw)) {
      return {
        ok: false,
        error: 'Please enter a valid email address',
      };
    }
    emailNormalized = normalizeEmailForLookup(emailRaw);
  }

  const phoneRaw = typeof o.phone === 'string' ? o.phone : '';
  const phoneNormalized = normalizePhoneForLookup(phoneRaw);
  if (
    phoneNormalized !== null &&
    phoneNormalized.length !== US_PHONE_DIGIT_COUNT
  ) {
    return { ok: false, error: INVALID_US_PHONE_MESSAGE };
  }

  const notesRaw = typeof o.notes === 'string' ? o.notes.trim() : '';
  if (notesRaw.length > CUSTOMER_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Notes cannot exceed ${CUSTOMER_NOTE_MAX_LENGTH} characters`,
    };
  }
  const notes = notesRaw.length > 0 ? notesRaw : null;

  return {
    ok: true,
    fullName,
    phone: phoneNormalized,
    email: emailNormalized,
    phoneNormalized,
    emailNormalized,
    notes,
  };
}
