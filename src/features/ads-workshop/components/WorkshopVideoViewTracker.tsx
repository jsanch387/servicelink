'use client';

import { useEffect, useRef } from 'react';

import {
  trackWorkshopEvent,
  WORKSHOP_ANALYTICS_EVENTS,
} from '../utils/workshopAnalytics';
import { markWorkshopAttribution } from '../utils/workshopAttribution';
import { trackWorkshopLeadInSupabase } from '../utils/workshopLeadTracking';

const VIDEO_VIEW_SESSION_KEY = 'sl_workshop_video_view_tracked';

export function WorkshopVideoViewTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    try {
      if (sessionStorage.getItem(VIDEO_VIEW_SESSION_KEY) === '1') return;
      sessionStorage.setItem(VIDEO_VIEW_SESSION_KEY, '1');
    } catch {
      // Still fire once per mount if sessionStorage blocked
    }

    markWorkshopAttribution();
    trackWorkshopEvent(WORKSHOP_ANALYTICS_EVENTS.VIDEO_VIEW);
    void trackWorkshopLeadInSupabase('video_view');
  }, []);

  return null;
}
