/**
 * After Stripe advances the billing period with no visit linked, remind the
 * customer (email + SMS) and nudge the owner (in-app + push).
 * Idempotent per `metadata.visit_reminder_sent_for_period_start`.
 */

import { getPublicMembershipVisitPath } from '@/constants/routes';
import { sendMembershipVisitReminderEmail } from '@/features/email/membership-visit-reminder/sendMembershipVisitReminderEmail';
import {
  buildMembershipVisitReminderSms,
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
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  periodStartsMatch,
  resolveMembershipVisitStatus,
  shouldSendMembershipPeriodVisitReminder,
} from './membershipVisitStatus';
import { notifyOwnerMembershipVisitNeeded } from './notifyOwnerMembershipVisitNeeded';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';
import { membershipCustomerSmsOptedIn } from '../utils/membershipSmsOptIn';
import { loadCustomerSmsOptIn } from '@/features/customer-management/server/loadCustomerSmsOptIn';

export async function sendMembershipPeriodVisitRemindersIfApplicable(
  supabase: SupabaseClient<Database>,
  args: {
    membershipId: string;
    stripeEventId?: string | null;
    request?: Request;
  }
): Promise<void> {
  const mid = args.membershipId.trim();
  if (!mid) return;
  const eventId = args.stripeEventId?.trim() || undefined;

  const admin = createSupabaseAdminClient();
  const { data: row, error } = await customerMembershipsOf(admin)
    .select('*')
    .eq('id', mid)
    .maybeSingle();

  if (error || !row) {
    logMemberships(eventId, 'warn', 'visit_reminder.missing', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(error),
    });
    return;
  }

  const initialBookingId = (row.initial_booking_id as string | null)?.trim();
  if (!initialBookingId) {
    // First visit is handled by checkout; wait until onboarding booking exists.
    return;
  }

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const visitStatus = resolveMembershipVisitStatus({
    status,
    cancelScheduled: isMembershipCancelScheduled(row),
    currentPeriodStart: row.current_period_start as string | null,
    periodVisitBookingId: row.period_visit_booking_id as string | null,
    periodVisitPeriodStart: row.period_visit_period_start as string | null,
  });
  const periodStart = (row.current_period_start as string | null)?.trim();
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const alreadyFor =
    typeof meta.visit_reminder_sent_for_period_start === 'string'
      ? meta.visit_reminder_sent_for_period_start
      : null;
  if (
    !shouldSendMembershipPeriodVisitReminder({
      visitStatus,
      status,
      cancelScheduled: isMembershipCancelScheduled(row),
      periodStart,
      alreadyRemindedForPeriod: periodStartsMatch(alreadyFor, periodStart),
    })
  ) {
    return;
  }
  if (!periodStart) return;

  let planName = 'Your plan';
  if (row.plan_id) {
    const { data: plan } = await membershipPlansOf(admin)
      .select('name')
      .eq('id', row.plan_id as string)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, business_slug, profile_id')
    .eq('id', row.business_id as string)
    .maybeSingle();

  const biz = business as {
    business_name?: string | null;
    business_slug?: string | null;
    profile_id?: string | null;
  } | null;

  const businessName =
    biz?.business_name?.trim() ||
    biz?.business_slug?.trim() ||
    'Your membership';
  const slug =
    biz?.business_slug?.trim() ||
    (typeof meta.businessSlug === 'string' ? meta.businessSlug.trim() : '');
  if (!slug) {
    logMemberships(eventId, 'warn', 'visit_reminder.no_slug', {
      membershipId: shortIdForLog(mid),
    });
    return;
  }

  const token = signMembershipManageToken(mid);
  const baseUrl = getAppBaseUrl(args.request);
  const schedulePath = getPublicMembershipVisitPath(slug, token);
  const scheduleUrl = `${baseUrl}${schedulePath}`;

  const customerName = (row.customer_name as string | null)?.trim() || null;
  const email = (row.customer_email as string | null)?.trim() || '';
  const phone = (row.customer_phone as string | null)?.trim() || '';

  let emailSent = false;
  if (email) {
    const mail = await sendMembershipVisitReminderEmail(email, {
      businessName,
      customerName,
      planName,
      scheduleUrl,
    });
    emailSent = mail.sent;
    if (!mail.sent) {
      logMemberships(eventId, 'warn', 'visit_reminder.email_failed', {
        membershipId: shortIdForLog(mid),
        reason: mail.error,
      });
    }
  }

  let smsSent = false;
  if (phone) {
    const customerId = (row.customer_id as string | null) ?? null;
    const optedIn = customerId
      ? await loadCustomerSmsOptIn(admin, customerId)
      : membershipCustomerSmsOptedIn(meta);
    if (optedIn) {
      const sms = await sendAndRecordSms({
        admin,
        businessId: row.business_id as string,
        customerId,
        type: 'membership_visit_reminder',
        to: phone,
        message: buildMembershipVisitReminderSms({ scheduleUrl }),
        dedupeKey: `${mid}:visit_reminder:${periodStart}`,
        correlationId: eventId,
      });
      smsSent = sms.sent;
    }
  }

  const profileId = biz?.profile_id?.trim();
  if (profileId) {
    await notifyOwnerMembershipVisitNeeded(admin, {
      businessId: row.business_id as string,
      membershipId: mid,
      customerName,
      periodStart,
      requestId: eventId,
    });
  }

  if (!emailSent && !smsSent && !email && !phone) {
    logMemberships(eventId, 'warn', 'visit_reminder.no_contact', {
      membershipId: shortIdForLog(mid),
    });
  }

  // Mark reminded even if only owner was nudged, so we don't spam on every
  // subscription.updated. Retry path: clear metadata key in SQL if needed.
  const nextMeta: Json = {
    ...meta,
    visit_reminder_sent_for_period_start: periodStart,
    visit_reminder_sent_at: new Date().toISOString(),
    businessSlug: slug,
  };

  const { error: patchError } = await customerMembershipsOf(admin)
    .update({ metadata: nextMeta })
    .eq('id', mid);

  if (patchError) {
    logMemberships(eventId, 'warn', 'visit_reminder.meta_failed', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(patchError),
    });
  } else {
    logMemberships(eventId, 'info', 'visit_reminder.sent', {
      membershipId: shortIdForLog(mid),
      email: emailSent ? 1 : 0,
      sms: smsSent ? 1 : 0,
      owner: profileId ? 1 : 0,
    });
  }
}
