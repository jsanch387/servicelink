import {
  flushGoogleAdsSignupIfPending,
  markGoogleAdsSignupPending,
  trackGoogleAdsSignupOnce,
} from './googleAdsTracking';
import {
  flushMetaLeadIfPending,
  markMetaLeadPending,
  trackMetaLeadOnce,
} from './metaLeadTracking';

/** Queue ad-platform lead events before a client navigation. */
export function markSignupLeadPending(): void {
  markMetaLeadPending();
  markGoogleAdsSignupPending();
}

/** Fire Meta Lead + Google Ads signup once per browser (deduped). */
export function trackSignupLeadOnce(): void {
  trackMetaLeadOnce();
  trackGoogleAdsSignupOnce();
}

/** Send leads queued before redirect (check-email page). */
export function flushSignupLeadIfPending(): void {
  flushMetaLeadIfPending();
  flushGoogleAdsSignupIfPending();
}
