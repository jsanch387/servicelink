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
  ProfileViewAnalytics,
  TrackViewRequest,
  TrackViewResponse,
} from './types/analytics';

// Services
export { AnalyticsApi } from './services/analyticsApi';
export { viewTrackingService } from './services/viewTracking';

// Hooks
export { useAnalytics } from './hooks/useAnalytics';

// Components
export { ViewTracker } from './components/ViewTracker';
