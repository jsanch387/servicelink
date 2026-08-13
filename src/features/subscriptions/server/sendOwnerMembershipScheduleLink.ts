/**
 * Owner resends the public period-visit schedule link to the customer.
 */

import { getPublicMembershipVisitPath } from '@/constants/routes';
import { sendMembershipVisitReminderEmail } from '@/features/email/membership-visit-reminder/sendMembershipVisitReminderEmail';
import {
  buildMembershipVisitReminderSms,
  sendAndRecordSms,
} from '@/features/sms';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { mapMembershipStatusToOwner } from './mapCustomerMembershipToOwnerSubscriber';
import { signMembershipManageToken } from './membershipManageToken';
import { logMemberships, shortIdForLog } from './membershipsTransactionLog';
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
  | { ok: false; error: string; status: number }
> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  const { data: row, error } = await customerMembershipsOf(supabase)
    .select(
      'id, business_id, plan_id, customer_id, customer_name, customer_email, customer_phone, status, current_period_start, period_visit_booking_id, period_visit_period_start, initial_booking_id'
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
  if (visitStatus === 'scheduled') {
    return {
      ok: false,
      error: 'A visit is already scheduled for this period.',
      status: 409,
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

  let emailed = false;
  if (email) {
    const mail = await sendMembershipVisitReminderEmail(email, {
      businessName,
      customerName: (row.customer_name as string | null)?.trim() || null,
      planName,
      scheduleUrl,
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
    const admin = createSupabaseAdminClient();
    const sms = await sendAndRecordSms({
      admin,
      businessId,
      customerId: (row.customer_id as string | null) ?? null,
      type: 'membership_visit_reminder',
      to: phone,
      message: buildMembershipVisitReminderSms({ scheduleUrl }),
      dedupeKey: `${membershipId}:schedule_link:${Date.now()}`,
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

  return { ok: true, emailed, smsed, scheduleUrl };
}
