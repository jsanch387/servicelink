/**
 * Owner resends the public period-visit schedule link to the customer.
 */

import { getPublicMembershipVisitPath } from '@/constants/routes';
import { sendMembershipVisitReminderEmail } from '@/features/email/membership-visit-reminder/sendMembershipVisitReminderEmail';
import {
  buildMembershipScheduleLinkSms,
  sendAndRecordSms,
} from '@/features/sms';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isMembershipCancelScheduled,
  mapMembershipStatusToOwner,
} from './mapCustomerMembershipToOwnerSubscriber';
import { signMembershipManageToken } from './membershipManageToken';
import { logMemberships, shortIdForLog } from './membershipsTransactionLog';
import {
  evaluateMembershipScheduleLinkThrottle,
  membershipScheduleLinkThrottleMessage,
  stampMembershipScheduleLinkMetadata,
} from './membershipScheduleLinkThrottle';
import { resolveMembershipVisitStatus } from './membershipVisitStatus';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';

export async function sendOwnerMembershipScheduleLink(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    request?: Request;
  }
): Promise<
  | { ok: true; emailed: boolean; smsed: boolean; scheduleUrl: string }
  | { ok: false; error: string; status: number; retryAfterSec?: number }
> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  const { data: row, error } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, status, cancel_at_period_end, cancel_at, current_period_start, period_visit_booking_id, period_visit_period_start, initial_booking_id, metadata'
    )
    .eq('id', membershipId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'Could not load subscriber.', status: 500 };
  }
  if (!row) {
    return { ok: false, error: 'Subscriber not found.', status: 404 };
  }

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const visitStatus = resolveMembershipVisitStatus({
    status,
    cancelScheduled: isMembershipCancelScheduled(row),
    currentPeriodStart: row.current_period_start as string | null,
    periodVisitBookingId: row.period_visit_booking_id as string | null,
    periodVisitPeriodStart: row.period_visit_period_start as string | null,
  });

  if (visitStatus === 'none') {
    return {
      ok: false,
      error: 'This membership is not active.',
      status: 409,
    };
  }
  if (visitStatus === 'scheduled' || visitStatus === 'completed') {
    return {
      ok: false,
      error:
        visitStatus === 'completed'
          ? 'This period\'s visit is already complete.'
          : 'A visit is already scheduled for this period.',
      status: 409,
    };
  }

  const throttle = evaluateMembershipScheduleLinkThrottle({
    currentPeriodStart: row.current_period_start as string | null,
    metadata: row.metadata,
  });
  if (!throttle.ok) {
    return {
      ok: false,
      error: membershipScheduleLinkThrottleMessage(throttle.reason),
      status: 429,
      retryAfterSec: throttle.retryAfterSec,
    };
  }

  const email = (row.customer_email as string | null)?.trim() || '';
  const phone = (row.customer_phone as string | null)?.trim() || '';
  if (!email && !phone) {
    return {
      ok: false,
      error: 'No email or phone on file for this subscriber.',
      status: 400,
    };
  }

  let planName = 'Your plan';
  if (row.plan_id) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name')
      .eq('id', row.plan_id as string)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', businessId)
    .maybeSingle();

  const biz = business as {
    business_name?: string | null;
    business_slug?: string | null;
  } | null;
  const slug = biz?.business_slug?.trim();
  if (!slug) {
    return { ok: false, error: 'Business slug missing.', status: 500 };
  }

  const businessName = biz?.business_name?.trim() || slug || 'Your membership';
  const token = signMembershipManageToken(membershipId);
  const schedulePath = getPublicMembershipVisitPath(slug, token);
  const scheduleUrl = `${getAppBaseUrl(args.request)}${schedulePath}`;
  const periodStart =
    (row.current_period_start as string | null)?.trim() ||
    new Date().toISOString();
  const nextMeta = stampMembershipScheduleLinkMetadata(
    row.metadata,
    periodStart,
    new Date().toISOString()
  );
  const sendCount =
    typeof nextMeta.schedule_link_send_count === 'number'
      ? nextMeta.schedule_link_send_count
      : 1;
  const admin = createSupabaseAdminClient();

  let emailed = false;
  if (email) {
    const mail = await sendMembershipVisitReminderEmail(email, {
      businessName,
      customerName: (row.customer_name as string | null)?.trim() || null,
      planName,
      scheduleUrl,
      kind: 'schedule_link',
    });
    emailed = mail.sent;
    if (!mail.sent) {
      logMemberships(undefined, 'warn', 'schedule_link.email_failed', {
        membershipId: shortIdForLog(membershipId),
        reason: mail.error,
      });
    }
  }

  let smsed = false;
  if (phone) {
    const sms = await sendAndRecordSms({
      admin,
      businessId,
      customerId: (row.customer_id as string | null) ?? null,
      type: 'membership_visit_reminder',
      to: phone,
      message: buildMembershipScheduleLinkSms({ scheduleUrl }),
      dedupeKey: `${membershipId}:schedule_link:${periodStart}:${sendCount}`,
    });
    smsed = sms.sent;
  }

  if (!emailed && !smsed) {
    return {
      ok: false,
      error: 'Could not send the schedule link. Try again.',
      status: 500,
    };
  }

  const { error: metaError } = await customerMembershipsOf(admin)
    .update({ metadata: nextMeta as Json })
    .eq('id', membershipId);
  if (metaError) {
    logMemberships(undefined, 'warn', 'schedule_link.meta_failed', {
      membershipId: shortIdForLog(membershipId),
    });
  }

  return { ok: true, emailed, smsed, scheduleUrl };
}
