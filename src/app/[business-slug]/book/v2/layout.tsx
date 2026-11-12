import { getBusinessBookPath } from '@/constants/routes';
import { publicBookingV2EnabledForOwner } from '@/features/booking-v2/server/publicBookingV2Access';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Keeps booking v2 behind the rollout gate. Other businesses land on the
 * current `/book` flow, including direct links.
 */
export default async function BookingV2GateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ 'business-slug': string }>;
}) {
  const { 'business-slug': slug } = await params;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('business_profiles')
    .select('profile_id')
    .eq('business_slug', slug)
    .maybeSingle();
  const allowed = await publicBookingV2EnabledForOwner(
    admin,
    (data as { profile_id?: string | null } | null)?.profile_id
  );
  if (!allowed) {
    redirect(getBusinessBookPath(slug));
  }
  return children;
}
