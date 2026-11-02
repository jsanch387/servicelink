import { isValidPaymentRequestShortCode } from './generatePaymentRequestShortCode';

export const PAYMENT_LINK_RESUME_COOKIE = 'sl_pay_resume';

const MAX_AGE_SEC = 60 * 60 * 24;

/** `/p/{shortCode}` — used to send Stripe cancel back to the same receipt. */
export function paymentLinkShortCodeFromPathname(
  pathname: string
): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 2 || segments[0] !== 'p') return null;
  let code = segments[1] ?? '';
  try {
    code = decodeURIComponent(code).trim();
  } catch {
    return null;
  }
  return isValidPaymentRequestShortCode(code) ? code : null;
}

export function paymentLinkResumeCookie(code: string): {
  name: string;
  value: string;
  path: string;
  maxAge: number;
  sameSite: 'lax';
  httpOnly: boolean;
  secure: boolean;
} {
  return {
    name: PAYMENT_LINK_RESUME_COOKIE,
    value: code,
    path: '/',
    maxAge: MAX_AGE_SEC,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
}
