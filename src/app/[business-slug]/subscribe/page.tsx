import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import {
  parseStoredTimeOffBlocks,
  toTimeOffIntervalFields,
} from '@/features/availability/types/blockTime';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { isProAccess } from '@/features/pricing';
import { PublicMembershipSubscribePage } from '@/features/subscriptions/components/PublicMembershipSubscribePage';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '@/features/subscriptions/constants/membershipVisitDuration';
import { loadPublicMembershipPlans } from '@/features/subscriptions/server/loadPublicMembershipPlans';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface PublicMembershipSubscribeRouteProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams?: Promise<{
    planId?: string | string[];
    priceId?: string | string[];
    lang?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function PublicMembershipSubscribeRoute({
  params,
  searchParams,
}: PublicMembershipSubscribeRouteProps) {
  const { 'business-slug': slug } = await params;
  const sp = (await searchParams) ?? {};
  const planId = firstParam(sp.planId)?.trim() ?? '';
  const priceId = firstParam(sp.priceId)?.trim() ?? '';
  if (!slug?.trim() || !planId || !priceId) notFound();

  const admin = createSupabaseAdminClient();
  const visible = await isPublicBusinessSlugVisible(admin, slug);
  if (!visible) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('business_profiles')
    .select(
      'id, profile_id, public_booking_locales, public_booking_default_locale'
    )
    .eq('business_slug', slug)
    .maybeSingle();

  if (!profile) notFound();

  const businessId = (profile as { id: string }).id;
  const profileId = (profile as { profile_id?: string | null }).profile_id;
  let ownerHasPro = false;
  if (profileId) {
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select(
        'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .eq('user_id', profileId)
      .maybeSingle();
    const row = ownerProfile as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    } | null;
    ownerHasPro = isProAccess(
      row?.subscription_tier,
      row?.subscription_current_period_end,
      row?.subscription_status,
      row?.stripe_subscription_id,
      row?.stripe_customer_id
    );
  }

  const plans = await loadPublicMembershipPlans(admin, businessId, {
    ownerHasPro,
  });
  const plan = plans.find(p => p.id === planId) ?? null;
  const cadence =
    plan?.cadenceOptions.find(option => option.id === priceId) ?? null;
  if (!plan || !cadence) notFound();

  const availabilityRow = await getAvailabilityForBusiness(admin, businessId);
  const weeklySchedule = availabilityRow?.weekly_schedule ?? DEFAULT_SCHEDULE;
  const timeOffBlocks: TimeOffInterval[] = parseStoredTimeOffBlocks(
    availabilityRow?.time_off_blocks
  ).map(toTimeOffIntervalFields);
  const minimumNotice = availabilityRow?.minimum_notice ?? 'none';
  const schedulingReady = availabilityRow?.accept_bookings === true;

  const cookieStore = await cookies();
  const bookingFlowLocale = resolvePublicBookingFlowLocale({
    offeredLocales: normalizePublicBookingOfferedLocales(
      (profile as { public_booking_locales?: string[] | null })
        .public_booking_locales
    ),
    businessDefaultLocale: (
      profile as { public_booking_default_locale?: string | null }
    ).public_booking_default_locale,
    searchParamsLang: firstParam(sp.lang),
    cookieValue: cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value,
  });

  return (
    <PublicMembershipSubscribePage
      businessSlug={slug}
      plan={plan}
      cadenceOption={cadence}
      bookingFlowLocale={bookingFlowLocale}
      weeklySchedule={weeklySchedule}
      timeOffBlocks={timeOffBlocks}
      minimumNotice={minimumNotice}
      schedulingReady={schedulingReady}
      visitDurationMinutes={
        plan.visitDurationMinutes ?? MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT
      }
    />
  );
}
