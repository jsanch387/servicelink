import { API_ROUTES } from '@/constants/routes';
import { signupAttributionSyncedKey } from '../constants';
import type { MarketingUtmAttribution } from '../types';
import { getStoredMarketingUtms } from './utmCapture';
import { clearPendingSignupAttribution } from './pendingSignupAttribution';

function toApiPayload(attribution?: MarketingUtmAttribution) {
  if (!attribution) return {};
  return {
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    utmContent: attribution.utmContent,
    utmTerm: attribution.utmTerm,
    fbclid: attribution.fbclid,
    gclid: attribution.gclid,
    landingPath: attribution.landingPath,
    referrer: attribution.referrer,
  };
}

export async function tryRecordSignupAttribution(
  userId: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const syncedKey = signupAttributionSyncedKey(userId);
  try {
    if (sessionStorage.getItem(syncedKey) === '1') return;
  } catch {
    // ignore
  }

  const attribution = getStoredMarketingUtms();

  try {
    const response = await fetch(API_ROUTES.MARKETING_ATTRIBUTION_SIGNUP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(attribution)),
    });

    const result = (await response.json()) as {
      success?: boolean;
      data?: { recorded?: boolean; skipped?: boolean };
    };

    if (!response.ok || !result.success) return;

    try {
      sessionStorage.setItem(syncedKey, '1');
    } catch {
      // ignore
    }

    clearPendingSignupAttribution();
  } catch {
    // non-blocking — will retry on next authenticated page load
  }
}
