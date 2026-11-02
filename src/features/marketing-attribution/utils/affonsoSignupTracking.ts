export const AFFONSO_SIGNUP_TRACKED_KEY = 'sl_affonso_signup_tracked';

export type AffonsoSignupDetails = {
  email?: string | null;
  externalUserId?: string | null;
  name?: string | null;
};

type AffonsoApi = {
  signup: (
    payload:
      | string
      | {
          email?: string;
          externalUserId?: string;
          name?: string;
        }
  ) => void;
};

declare global {
  interface Window {
    Affonso?: AffonsoApi;
  }
}

function getAffonso(): AffonsoApi | null {
  if (typeof window === 'undefined') return null;
  const api = window.Affonso;
  if (!api || typeof api.signup !== 'function') return null;
  return api;
}

function waitForAffonso(timeoutMs = 4000): Promise<AffonsoApi | null> {
  const existing = getAffonso();
  if (existing) return Promise.resolve(existing);

  return new Promise(resolve => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const api = getAffonso();
      if (api || Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        resolve(api);
      }
    }, 50);
  });
}

function alreadyTracked(): boolean {
  try {
    return localStorage.getItem(AFFONSO_SIGNUP_TRACKED_KEY) === '1';
  } catch {
    return false;
  }
}

function markTracked(): void {
  try {
    localStorage.setItem(AFFONSO_SIGNUP_TRACKED_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Tell Affonso a user registered. Safe to call for every signup — Affonso only
 * creates a LEAD when the `affonso_referral` cookie is present.
 */
export async function trackAffonsoSignupOnce(
  details?: AffonsoSignupDetails
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (alreadyTracked()) return;

  const email = details?.email?.trim() || '';
  const externalUserId = details?.externalUserId?.trim() || '';
  const name = details?.name?.trim() || '';
  if (!email && !externalUserId) return;

  const api = await waitForAffonso();
  if (!api) return;

  if (email && !externalUserId && !name) {
    api.signup(email);
  } else {
    api.signup({
      ...(email ? { email } : {}),
      ...(externalUserId ? { externalUserId } : {}),
      ...(name ? { name } : {}),
    });
  }

  markTracked();
}
