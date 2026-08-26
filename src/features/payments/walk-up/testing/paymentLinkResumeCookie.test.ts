import { describe, expect, it } from 'vitest';
import {
  PAYMENT_LINK_RESUME_COOKIE,
  paymentLinkResumeCookie,
  paymentLinkShortCodeFromPathname,
} from '../paymentLinkResumeCookie';

describe('paymentLinkShortCodeFromPathname', () => {
  it('reads a valid /p/{code} path', () => {
    expect(paymentLinkShortCodeFromPathname('/p/TuTB2v5d')).toBe('TuTB2v5d');
    expect(paymentLinkShortCodeFromPathname('/p/TuTB2v5d/')).toBe('TuTB2v5d');
  });

  it('rejects other paths', () => {
    expect(paymentLinkShortCodeFromPathname('/p')).toBeNull();
    expect(paymentLinkShortCodeFromPathname('/pay/complete')).toBeNull();
    expect(paymentLinkShortCodeFromPathname('/p/not valid')).toBeNull();
  });
});

describe('paymentLinkResumeCookie', () => {
  it('stores the short code', () => {
    const cookie = paymentLinkResumeCookie('TuTB2v5d');
    expect(cookie.name).toBe(PAYMENT_LINK_RESUME_COOKIE);
    expect(cookie.value).toBe('TuTB2v5d');
    expect(cookie.sameSite).toBe('lax');
    expect(cookie.httpOnly).toBe(true);
  });
});
