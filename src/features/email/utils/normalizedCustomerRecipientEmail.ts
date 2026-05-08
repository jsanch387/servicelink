import { isValidEmail } from '@/features/auth/utils/validation';

/**
 * Returns a trimmed, validated address or null. Use before any customer-facing
 * `Resend` send so we never call the API with an empty or malformed `to`.
 */
export function normalizedCustomerRecipientEmail(to: unknown): string | null {
  const s = typeof to === 'string' ? to.trim() : '';
  if (!s || !isValidEmail(s)) return null;
  return s;
}
