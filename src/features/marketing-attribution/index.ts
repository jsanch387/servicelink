export {
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

export { MarketingAttributionRoot } from './components/MarketingAttributionRoot';
export {
  captureMarketingUtmsFromSearchParams,
  getStoredMarketingUtms,
  hasMarketingUtmData,
  parseMarketingUtmsFromSearchParams,
  persistMarketingUtms,
} from './utils/utmCapture';
export {
  clearPendingSignupAttribution,
  hasPendingSignupAttribution,
  markPendingSignupAttribution,
} from './utils/pendingSignupAttribution';
export { tryRecordSignupAttribution } from './utils/attributionApi';
