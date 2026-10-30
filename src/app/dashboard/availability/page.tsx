/**
 * Availability Dashboard Page
 *
 * Lets business owners set working hours and accept-bookings toggle.
 * Feature is gated by AVAILABILITY_FEATURE_ENABLED.
 */

import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import { AvailabilityContent } from '@/features/availability';
import { requireCompletedShopPage } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  if (!AVAILABILITY_FEATURE_ENABLED) {
    redirect('/dashboard');
  }

  await requireCompletedShopPage('availability.write');

  return <AvailabilityContent />;
}
