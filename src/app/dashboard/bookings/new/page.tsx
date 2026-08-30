import { ROUTES } from '@/constants/routes';
import { CreateAppointmentWizard } from '@/features/availability/booking/create-appointment';
import { FREE_BOOKINGS_LIMIT, isProAccess } from '@/features/pricing';
import type { MembershipVisitPrefill } from '@/features/availability/booking/create-appointment/types/membershipVisitPrefill';
import { loadPublicBookingServiceLocation } from '@/features/business-profile/server/loadPrimaryServiceArea';
import { loadOwnerBookingSale } from '@/features/marketing/server/loadOwnerBookingSale';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { loadQuoteServiceCatalog } from '@/features/quotes/server/loadQuoteServiceCatalog';
import { getServiceCategories } from '@/features/services/categories/api/getServiceCategories';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '@/features/subscriptions/constants/membershipVisitDuration';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from '@/features/subscriptions/server/membershipTablesQuery';
import {
  isUsableMembershipAddress,
  isUsableMembershipVehicle,
  resolveMembershipCustomerServiceSnapshot,
} from '@/features/subscriptions/server/resolveMembershipCustomerServiceSnapshot';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function loadMembershipVisitPrefill(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  businessId: string,
  searchParams: {
    membershipId?: string | string[];
    name?: string | string[];
    email?: string | string[];
    phone?: string | string[];
    notes?: string | string[];
    planName?: string | string[];
    durationMinutes?: string | string[];
  }
): Promise<MembershipVisitPrefill | null> {
  const membershipId = firstParam(searchParams.membershipId)?.trim() || '';
  if (!membershipId || !UUID_RE.test(membershipId)) return null;

  const { data: membership } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, notes'
    )
    .eq('id', membershipId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!membership) return null;

  let planName =
    firstParam(searchParams.planName)?.trim() || 'Membership visit';
  let visitDurationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT;
  const planId = (membership.plan_id as string | null)?.trim();
  if (planId) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name, visit_duration_minutes')
      .eq('id', planId)
      .maybeSingle();
    if (plan?.name?.trim()) planName = plan.name.trim();
    const minutes = Number(
      (plan as { visit_duration_minutes?: number | null } | null)
        ?.visit_duration_minutes
    );
    if (Number.isInteger(minutes) && minutes >= 30) {
      visitDurationMinutes = minutes;
    }
  }

  const durationFromQuery = Number(firstParam(searchParams.durationMinutes));
  if (
    Number.isInteger(durationFromQuery) &&
    durationFromQuery >= 30 &&
    durationFromQuery <= 630
  ) {
    visitDurationMinutes = durationFromQuery;
  }

  const nameFromQuery = firstParam(searchParams.name)?.trim();
  const emailFromQuery = firstParam(searchParams.email)?.trim();
  const phoneFromQuery = firstParam(searchParams.phone)?.trim();
  const notesFromQuery = firstParam(searchParams.notes)?.trim();

  const customerName =
    nameFromQuery ||
    (membership.customer_name as string | null)?.trim() ||
    'Customer';
  const email =
    emailFromQuery ||
    (membership.customer_email as string | null)?.trim() ||
    '';
  const phoneRaw =
    phoneFromQuery ||
    (membership.customer_phone as string | null)?.trim() ||
    '';
  const phone = phoneRaw ? normalizeUsPhoneDigits(phoneRaw) : '';
  const notes =
    notesFromQuery || (membership.notes as string | null)?.trim() || '';

  const snapshot = await resolveMembershipCustomerServiceSnapshot(supabase, {
    businessId,
    phone,
    email,
    customerId: (membership.customer_id as string | null)?.trim() || null,
  });

  return {
    membershipId,
    planName: planName || 'Membership visit',
    visitDurationMinutes,
    customerName,
    email,
    phone,
    notes: notes || undefined,
    address: isUsableMembershipAddress(snapshot.address)
      ? snapshot.address
      : undefined,
    vehicle: isUsableMembershipVehicle(snapshot.vehicle)
      ? snapshot.vehicle
      : undefined,
  };
}

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    membershipId?: string | string[];
    name?: string | string[];
    email?: string | string[];
    phone?: string | string[];
    notes?: string | string[];
    planName?: string | string[];
    durationMinutes?: string | string[];
  }>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const stateResult = await getOnboardingState(user.id, supabase);
  if (!stateResult.success || stateResult.data?.status !== 'completed') {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select(
      'id, business_name, business_slug, business_type, service_location_mode, service_area, business_zip, shop_street_address, shop_unit, shop_city, shop_state, shop_zip, free_bookings_count'
    )
    .eq('profile_id', user.id)
    .maybeSingle();

  if (businessError || !businessRow) {
    redirect(ROUTES.DASHBOARD.MAIN);
  }

  const business = businessRow as {
    id: string;
    business_name: string;
    business_slug: string | null;
    business_type?: string | null;
    service_location_mode?: string | null;
    service_area?: string | null;
    business_zip?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
    shop_city?: string | null;
    shop_state?: string | null;
    shop_zip?: string | null;
    free_bookings_count?: number | null;
  };

  const { data: ownerProfileRow } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const ownerProfile = ownerProfileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  const isFreeTier = !isProAccess(
    ownerProfile?.subscription_tier ?? 'free',
    ownerProfile?.subscription_current_period_end ?? null,
    ownerProfile?.subscription_status,
    ownerProfile?.stripe_subscription_id,
    ownerProfile?.stripe_customer_id
  );
  if (
    isFreeTier &&
    (business.free_bookings_count ?? 0) >= FREE_BOOKINGS_LIMIT
  ) {
    redirect(ROUTES.DASHBOARD.BOOKINGS);
  }

  const slug = business.business_slug?.trim() ?? '';
  if (!slug) {
    redirect(ROUTES.DASHBOARD.BOOKINGS);
  }

  const params = (await searchParams) ?? {};

  const [serviceCatalog, categoriesResult, activeSale, membershipVisit] =
    await Promise.all([
      loadQuoteServiceCatalog(supabase, business.id),
      getServiceCategories(business.id),
      loadOwnerBookingSale(supabase, business.id),
      loadMembershipVisitPrefill(supabase, business.id, params),
    ]);

  const serviceLocation = await loadPublicBookingServiceLocation(
    supabase,
    business.id,
    business
  );

  return (
    <CreateAppointmentWizard
      businessId={business.id}
      businessSlug={slug}
      businessName={business.business_name}
      businessType={business.business_type}
      serviceCatalog={serviceCatalog}
      serviceCategories={categoriesResult.data ?? []}
      serviceLocation={serviceLocation}
      activeSale={activeSale}
      membershipVisit={membershipVisit}
    />
  );
}
