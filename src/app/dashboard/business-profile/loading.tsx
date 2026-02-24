/**
 * Loading state for Dashboard Business Profile page
 * Shows skeleton while profile data is fetched server-side
 */

import { BusinessProfileLoadingState } from '@/features/business-profile';

export default function DashboardBusinessProfileLoading() {
  return <BusinessProfileLoadingState />;
}
