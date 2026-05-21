/**
 * Analytics Feature Exports
 *
 * Clean exports for the analytics feature.
 * Single import point for all analytics functionality.
 */

// Types
export type {
  AnalyticsApiResponse,
  DashboardAnalytics,
  LinkViewsSummary,
  ProfileViewAnalytics,
  TrackViewRequest,
  TrackViewResponse,
} from './types/analytics';

export {
  ANALYTICS_PERIOD_LABELS,
  DASHBOARD_LINK_VIEWS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD,
  FREE_TIER_ANALYTICS_PERIOD,
  isProOnlyLinkViewsPeriod,
  resolveLinkViewsPeriodForAccess,
  type AnalyticsPeriod,
  type DashboardLinkViewsPeriod,
} from './constants';

// Services
export { AnalyticsApi } from './services/analyticsApi';
export { viewTrackingService } from './services/viewTracking';

// Hooks
export { useAnalytics } from './hooks/useAnalytics';

// Components
export { ViewTracker } from './components/ViewTracker';
export { MetaCompleteRegistrationTracker } from './components/MetaCompleteRegistrationTracker';
