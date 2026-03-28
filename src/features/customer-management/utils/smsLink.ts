const IOS_REGEX = /iPhone|iPad|iPod/i;

function normalizePhoneForSms(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[^\d+]/g, '');
}

/**
 * Build an `sms:` deep link with OS-specific body separator.
 * - iOS: `sms:+123?&body=...`
 * - Android/others: `sms:+123?body=...`
 */
export function buildSmsHref(
  phone: string,
  message: string,
  userAgent?: string
): string | null {
  const cleanPhone = normalizePhoneForSms(phone);
  if (!cleanPhone) return null;

  const ua =
    userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const isIos = IOS_REGEX.test(ua);
  const encodedBody = encodeURIComponent(message);
  const bodySeparator = isIos ? '?&body=' : '?body=';
  return `sms:${cleanPhone}${bodySeparator}${encodedBody}`;
}
