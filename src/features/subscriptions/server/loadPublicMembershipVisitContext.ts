/**
 * Resolve a signed membership visit token for the public schedule page.
 */

import { loadPublicBookingServiceLocation } from '@/features/business-profile/server/loadPrimaryServiceArea';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriberVisitStatus } from '../types/ownerSubscriptionPlan';
import {
  localTodayYmd,
  resolveMembershipPeriodVisitDateBounds,
} from '../utils/membershipPeriodVisitDateBounds';
import { loadLatestMembershipVisitYmd } from './loadLatestMembershipVisitYmd';
import {
  isMembershipCancelScheduled,
  mapMembershipStatusToOwner,
} from './mapCustomerMembershipToOwnerSubscriber';
import { verifyMembershipManageToken } from './membershipManageToken';
import {
  periodVisitIsOnFile,
  resolveMembershipVisitStatus,
} from './membershipVisitStatus';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import {
  resolveMembershipCustomerServiceSnapshot,
  type MembershipServiceAddress,
  type MembershipServiceVehicle,
} from './resolveMembershipCustomerServiceSnapshot';

export type PublicMembershipVisitContext =
  | {
      ok: true;
      membershipId: string;
      businessId: string;
      businessSlug: string;
      businessName: string;
      customerName: string;
      planName: string;
      visitDurationMinutes: number;
      visitStatus: OwnerSubscriberVisitStatus;
      periodVisitDate: string | null;
      periodVisitTime: string | null;
      needsAddress: boolean;
      needsVehicle: boolean;
      serviceDetailsComplete: boolean;
      /** Prefill when CRM has data; may be incomplete. */
      address: MembershipServiceAddress | null;
      vehicle: MembershipServiceVehicle | null;
      usingSavedDetails: boolean;
      visitMinDate: string | null;
      visitMaxDate: string | null;
    }
  | { ok: false; error: 'invalid_token' | 'not_found' | 'wrong_business' };

export async function loadPublicMembershipVisitContext(
  supabase: SupabaseClient<Database>,
  args: { token: string; businessSlug: string }
): Promise<PublicMembershipVisitContext> {
  const membershipId = verifyMembershipManageToken(args.token);
  if (!membershipId) {
    return { ok: false, error: 'invalid_token' };
  }

  const slug = args.businessSlug.trim();
  if (!slug) return { ok: false, error: 'not_found' };

  const { data: business } = await supabase
    .from('business_profiles')
    .select(
      'id, business_slug, business_name, service_location_mode, service_area, business_zip, shop_street_address, shop_unit'
    )
    .eq('business_slug', slug)
    .maybeSingle();

  const biz = business as {
    id?: string;
    business_slug?: string | null;
    business_name?: string | null;
    service_location_mode?: string | null;
    service_area?: string | null;
    business_zip?: string | null;
    shop_street_address?: string | null;
    shop_unit?: string | null;
  } | null;
  if (!biz?.id) return { ok: false, error: 'not_found' };

  const serviceLocation = await loadPublicBookingServiceLocation(
    supabase,
    biz.id,
    biz
  );
  const needsAddress = serviceLocation.mode !== 'shop_only';
  const needsVehicle = true;

  const { data: row } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, status, cancel_at_period_end, cancel_at, current_period_start, current_period_end, interval_unit, interval_count, period_visit_booking_id, period_visit_period_start, initial_booking_id'
    )
    .eq('id', membershipId)
    .maybeSingle();

  if (!row) return { ok: false, error: 'not_found' };

  if ((row.business_id as string) !== biz.id) {
    return { ok: false, error: 'wrong_business' };
  }

  let planName = 'Membership visit';
  let visitDurationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT;
  const planId = (row.plan_id as string | null)?.trim();
  if (planId) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name, visit_duration_minutes')
      .eq('id', planId)
      .maybeSingle();
    const p = plan as {
      name?: string | null;
      visit_duration_minutes?: number | null;
    } | null;
    if (p?.name?.trim()) planName = p.name.trim();
    if (
      typeof p?.visit_duration_minutes === 'number' &&
      p.visit_duration_minutes >= 30
    ) {
      visitDurationMinutes = p.visit_duration_minutes;
    }
  }

  let periodVisitDate: string | null = null;
  let periodVisitTime: string | null = null;
  let periodVisitBookingStatus: string | null = null;
  const periodBookingId = (
    row.period_visit_booking_id as string | null
  )?.trim();
  if (periodBookingId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking } = await (supabase as any)
      .from('bookings')
      .select('scheduled_date, start_time, status')
      .eq('id', periodBookingId)
      .eq('business_id', biz.id)
      .maybeSingle();
    const br = booking as {
      scheduled_date?: string | null;
      start_time?: string | null;
      status?: string | null;
    } | null;
    periodVisitDate = br?.scheduled_date?.trim() || null;
    const rawTime = br?.start_time?.trim() || '';
    periodVisitTime = rawTime ? rawTime.slice(0, 5) : null;
    periodVisitBookingStatus = br?.status?.trim() || null;
  }

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const visitStatus = resolveMembershipVisitStatus({
    status,
    cancelScheduled: isMembershipCancelScheduled(row),
    currentPeriodStart: row.current_period_start as string | null,
    periodVisitBookingId: row.period_visit_booking_id as string | null,
    periodVisitPeriodStart: row.period_visit_period_start as string | null,
    periodVisitBookingStatus,
  });

  if (!periodVisitIsOnFile(visitStatus)) {
    periodVisitDate = null;
    periodVisitTime = null;
  }

  const snapshot = await resolveMembershipCustomerServiceSnapshot(supabase, {
    businessId: biz.id,
    phone: (row.customer_phone as string | null) ?? null,
    email: (row.customer_email as string | null) ?? null,
    customerId: (row.customer_id as string | null) ?? null,
  });

  const serviceDetailsComplete =
    (!needsAddress || snapshot.hasUsableAddress) &&
    (!needsVehicle || snapshot.hasVehicle);
  const usingSavedDetails =
    Boolean(snapshot.customerId) && serviceDetailsComplete;

  const lastVisitYmd = await loadLatestMembershipVisitYmd(supabase, {
    businessId: biz.id,
    bookingIds: [
      row.initial_booking_id as string | null,
      row.period_visit_booking_id as string | null,
    ],
  });
  const dateBounds = resolveMembershipPeriodVisitDateBounds({
    todayYmd: localTodayYmd(),
    periodStartIso: row.current_period_start as string | null,
    periodEndIso: row.current_period_end as string | null,
    lastVisitYmd,
    intervalUnit: row.interval_unit as string | null,
    intervalCount:
      typeof row.interval_count === 'number' ? row.interval_count : null,
  });

  return {
    ok: true,
    membershipId,
    businessId: biz.id,
    businessSlug: (biz.business_slug ?? slug).trim(),
    businessName: (biz.business_name ?? '').trim() || slug,
    customerName: (row.customer_name as string | null)?.trim() || 'Member',
    planName,
    visitDurationMinutes,
    visitStatus,
    periodVisitDate,
    periodVisitTime,
    needsAddress,
    needsVehicle,
    serviceDetailsComplete,
    address: snapshot.address,
    vehicle: snapshot.vehicle,
    usingSavedDetails,
    visitMinDate: dateBounds?.minYmd ?? null,
    visitMaxDate: dateBounds?.maxYmd ?? null,
  };
}
