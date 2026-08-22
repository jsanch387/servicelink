export {
  AFFONSO_COOKIE_DURATION_DAYS,
  AFFONSO_PUBLIC_PROGRAM_ID,
  MARKETING_UTM_STORAGE_KEY,
  PENDING_SIGNUP_ATTRIBUTION_KEY,
  SIGNUP_ATTRIBUTION_PROFILE_MAX_AGE_MS,
  signupAttributionSyncedKey,
} from './constants';

export type {
  MarketingUtmAttribution,
  SaveSignupAttributionResult,
  SignupAttributionRow,
} from './types';

export type { SignupAttributionChannel } from './utils/deriveSignupChannel';
export {
  SIGNUP_ATTRIBUTION_CHANNELS,
  deriveSignupAttributionChannel,
} from './utils/deriveSignupChannel';

export { MarketingAttributionRoot } from './components/MarketingAttributionRoot';
export {
  captureMarketingUtmsFromSearchParams,
  getStoredMarketingUtms,
  hasMarketingUtmData,
  isAppShellPath,
  isNonAcquisitionReferrer,
  isWeakMarketingAttribution,
  parseMarketingUtmsFromSearchParams,
  persistMarketingUtms,
} from './utils/utmCapture';
export {
  blogGuideSignupPath,
  blogIndexSignupPath,
  buildMarketingSignupPath,
  siteSignupPath,
} from './utils/signupLinks';
export {
  clearPendingSignupAttribution,
  hasPendingSignupAttribution,
  markPendingSignupAttribution,
} from './utils/pendingSignupAttribution';
export { tryRecordSignupAttribution } from './utils/attributionApi';
export { trackAffonsoSignupOnce } from './utils/affonsoSignupTracking';
export type { AffonsoSignupDetails } from './utils/affonsoSignupTracking';
export { getAffonsoReferralId } from './utils/affonsoReferral';
