import {
  clearWorkshopAttribution,
  hasWorkshopAttribution,
} from './workshopAttribution';
import {
  trackWorkshopEvent,
  WORKSHOP_ANALYTICS_EVENTS,
} from './workshopAnalytics';
import { recordWorkshopSignupConversion } from './workshopLeadTracking';

/** Call after a successful account creation when workshop attribution is set. */
export function completeWorkshopSignupTracking(
  email?: string,
  userId?: string
): void {
  if (!hasWorkshopAttribution()) return;

  trackWorkshopEvent(WORKSHOP_ANALYTICS_EVENTS.SIGNUP_COMPLETE);
  void recordWorkshopSignupConversion({ email, userId });
  clearWorkshopAttribution();
}
