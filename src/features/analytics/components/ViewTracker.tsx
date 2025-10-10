/**
 * View Tracker Component
 *
 * Client-side component that tracks profile views when mounted.
 * Used in public profile pages to track analytics.
 */

'use client';

import { useEffect } from 'react';
import { viewTrackingService } from '../services/viewTracking';

interface ViewTrackerProps {
  businessSlug: string;
}

export const ViewTracker: React.FC<ViewTrackerProps> = ({ businessSlug }) => {
  useEffect(() => {
    if (businessSlug) {
      // Track the view when component mounts
      viewTrackingService.trackView(businessSlug);
    }
  }, [businessSlug]);

  // This component doesn't render anything visible
  return null;
};
