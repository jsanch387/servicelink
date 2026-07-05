import { PENDING_SIGNUP_ATTRIBUTION_KEY } from '../constants';

export function markPendingSignupAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PENDING_SIGNUP_ATTRIBUTION_KEY, '1');
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.setItem(PENDING_SIGNUP_ATTRIBUTION_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasPendingSignupAttribution(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.localStorage.getItem(PENDING_SIGNUP_ATTRIBUTION_KEY) === '1') {
      return true;
    }
  } catch {
    // ignore
  }

  try {
    if (window.sessionStorage.getItem(PENDING_SIGNUP_ATTRIBUTION_KEY) === '1') {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export function clearPendingSignupAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(PENDING_SIGNUP_ATTRIBUTION_KEY);
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.removeItem(PENDING_SIGNUP_ATTRIBUTION_KEY);
  } catch {
    // ignore
  }
}
