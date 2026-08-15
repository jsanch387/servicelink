import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import {
  parseStoredTimeOffBlocks,
  toTimeOffIntervalFields,
} from '@/features/availability/types/blockTime';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { PublicMembershipVisitPage } from '@/features/subscriptions/components/PublicMembershipVisitPage';
import { loadPublicMembershipVisitContext } from '@/features/subscriptions/server/loadPublicMembershipVisitContext';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface PublicMembershipVisitRouteProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams?: Promise<{
    token?: string | string[];
    lang?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function PublicMembershipVisitRoute({
  params,
  searchParams,
}: PublicMembershipVisitRouteProps) {
  const { 'business-slug': slug } = await params;
  const sp = (await searchParams) ?? {};
  const token = firstParam(sp.token)?.trim() ?? '';
  if (!slug?.trim() || !token) notFound();

  const admin = createSupabaseAdminClient();
  const visible = await isPublicBusinessSlugVisible(admin, slug);
  if (!visible) notFound();

  const ctx = await loadPublicMembershipVisitContext(admin, {
    token,
    businessSlug: slug,
  });
  if (!ctx.ok) notFound();

  const { data: profile } = await admin
    .from('business_profiles')
    .select('public_booking_locales, public_booking_default_locale')
    .eq('id', ctx.businessId)
    .maybeSingle();

  const availabilityRow = await getAvailabilityForBusiness(
    admin,
    ctx.businessId
  );
  const weeklySchedule = availabilityRow?.weekly_schedule ?? DEFAULT_SCHEDULE;
  const timeOffBlocks: TimeOffInterval[] = parseStoredTimeOffBlocks(
    availabilityRow?.time_off_blocks
  ).map(toTimeOffIntervalFields);
  const minimumNotice = availabilityRow?.minimum_notice ?? 'none';
  const schedulingReady = availabilityRow?.accept_bookings === true;

  const cookieStore = await cookies();
  const bookingFlowLocale = resolvePublicBookingFlowLocale({
    offeredLocales: normalizePublicBookingOfferedLocales(
      (profile as { public_booking_locales?: string[] | null } | null)
        ?.public_booking_locales
    ),
    businessDefaultLocale: (
      profile as { public_booking_default_locale?: string | null } | null
    )?.public_booking_default_locale,
    searchParamsLang: firstParam(sp.lang),
    cookieValue: cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value,
  });

  return (
    <PublicMembershipVisitPage
      businessSlug={ctx.businessSlug}
      businessName={ctx.businessName}
      token={token}
      planName={ctx.planName}
      customerName={ctx.customerName}
      visitStatus={ctx.visitStatus}
      periodVisitDate={ctx.periodVisitDate}
      periodVisitTime={ctx.periodVisitTime}
      bookingFlowLocale={bookingFlowLocale}
      weeklySchedule={weeklySchedule}
      timeOffBlocks={timeOffBlocks}
      minimumNotice={minimumNotice}
      schedulingReady={schedulingReady}
      visitDurationMinutes={ctx.visitDurationMinutes}
      needsAddress={ctx.needsAddress}
      needsVehicle={ctx.needsVehicle}
      serviceDetailsComplete={ctx.serviceDetailsComplete}
      usingSavedDetails={ctx.usingSavedDetails}
      initialAddress={ctx.address}
      initialVehicle={ctx.vehicle}
      visitMinDate={ctx.visitMinDate}
      visitMaxDate={ctx.visitMaxDate}
    />
  );
}
