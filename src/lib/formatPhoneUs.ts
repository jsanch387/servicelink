/**
 * Format a phone string for US-style display, e.g. (555) 123-4567.
 * Strips non-digits; supports partial input while typing (used in UI).
 */
export function formatPhoneUsDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return phone.trim();
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
