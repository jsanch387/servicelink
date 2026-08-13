/**
 * Resolve a signed membership visit token for the public schedule page.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriberVisitStatus } from '../types/ownerSubscriptionPlan';
import { mapMembershipStatusToOwner } from './mapCustomerMembershipToOwnerSubscriber';
import { verifyMembershipManageToken } from './membershipManageToken';
import { resolveMembershipVisitStatus } from './membershipVisitStatus';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';

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
    .select('id, business_slug, business_name')
    .eq('business_slug', slug)
    .maybeSingle();

  const biz = business as {
    id?: string;
    business_slug?: string | null;
    business_name?: string | null;
  } | null;
  if (!biz?.id) return { ok: false, error: 'not_found' };

  const { data: row } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_name, status, current_period_start, period_visit_booking_id, period_visit_period_start'
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

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const visitStatus = resolveMembershipVisitStatus({
    status,
    currentPeriodStart: row.current_period_start as string | null,
    periodVisitBookingId: row.period_visit_booking_id as string | null,
    periodVisitPeriodStart: row.period_visit_period_start as string | null,
  });

  let periodVisitDate: string | null = null;
  let periodVisitTime: string | null = null;
  const periodBookingId = (
    row.period_visit_booking_id as string | null
  )?.trim();
  if (visitStatus === 'scheduled' && periodBookingId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking } = await (supabase as any)
      .from('bookings')
      .select('scheduled_date, start_time')
      .eq('id', periodBookingId)
      .eq('business_id', biz.id)
      .maybeSingle();
    const br = booking as {
      scheduled_date?: string | null;
      start_time?: string | null;
    } | null;
    periodVisitDate = br?.scheduled_date?.trim() || null;
    const rawTime = br?.start_time?.trim() || '';
    periodVisitTime = rawTime ? rawTime.slice(0, 5) : null;
  }

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
  };
}
