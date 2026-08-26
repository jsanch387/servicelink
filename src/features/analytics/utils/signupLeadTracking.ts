import {
  trackAffonsoSignupOnce,
  type AffonsoSignupDetails,
} from '@/features/marketing-attribution/utils/affonsoSignupTracking';
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

/** Fire Meta / Google / Affonso signup once per browser (deduped). */
export function trackSignupLeadOnce(details?: AffonsoSignupDetails): void {
  trackMetaLeadOnce();
  trackGoogleAdsSignupOnce();
  void trackAffonsoSignupOnce(details);
}

/** Send leads queued before redirect (check-email page). */
export function flushSignupLeadIfPending(details?: AffonsoSignupDetails): void {
  flushMetaLeadIfPending();
  flushGoogleAdsSignupIfPending();
  void trackAffonsoSignupOnce(details);
}
