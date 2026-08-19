/**
 * Owner in-app + push when a subscriber needs a period visit.
 * Used on Stripe period rollover and when a linked visit booking is canceled.
 * Best-effort; unique `dedupe_key` makes retries safe.
 */

import { notificationMinimalDisplayTitle } from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';

export async function notifyOwnerMembershipVisitNeeded(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    customerName: string | null;
    /** Billing period start — part of the default dedupe key. */
    periodStart: string;
    /**
     * Extra suffix so a second notify in the same period is allowed
     * (e.g. after canceling the linked visit booking).
     */
    dedupeSuffix?: string | null;
    /** Override subtitle; default is "Schedule a visit for {name}". */
    body?: string | null;
    requestId?: string | null;
  }
): Promise<void> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  const periodStart = args.periodStart.trim();
  if (!businessId || !membershipId || !periodStart) return;

  const eventId = args.requestId?.trim() || undefined;

  const { data: profileRow, error: bizError } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const profileId =
    (profileRow as { profile_id?: string | null } | null)?.profile_id?.trim() ||
    '';

  if (bizError || !profileId) {
    logMemberships(eventId, 'warn', 'visit_needed.notify_skip', {
      membershipId: shortIdForLog(membershipId),
      reason: bizError ? 'business_lookup_failed' : 'no_owner_profile',
      ...supabaseErrorForLogs(bizError),
    });
    return;
  }

  const title = notificationMinimalDisplayTitle(
    'membership_visit_needed',
    'membership',
    'Subscription needs a visit',
    'Subscription needs a visit'
  );

  const customerName = args.customerName?.trim() || '';
  const bodyText =
    args.body?.trim() ||
    (customerName
      ? `Schedule a visit for ${customerName}`
      : 'Schedule a visit');

  const suffix = args.dedupeSuffix?.trim();
  const dedupeKey = suffix
    ? `membership_visit_needed:${membershipId}:${periodStart}:${suffix}`
    : `membership_visit_needed:${membershipId}:${periodStart}`;

  const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
    {
      user_id: profileId,
      type: 'membership_visit_needed',
      reference_type: 'membership',
      reference_id: membershipId,
      title,
      body: bodyText,
      dedupe_key: dedupeKey,
    };

  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notificationRow as never);

  if (notifError) {
    const code =
      typeof notifError === 'object' &&
      notifError &&
      'code' in notifError &&
      typeof (notifError as { code?: unknown }).code === 'string'
        ? (notifError as { code: string }).code
        : '';
    if (code !== '23505') {
      logMemberships(eventId, 'warn', 'visit_needed.notification_failed', {
        membershipId: shortIdForLog(membershipId),
        ...supabaseErrorForLogs(notifError),
      });
    }
  }

  await sendExpoPushToUser(supabase, {
    userId: profileId,
    title,
    body: bodyText,
    data: {
      reference_type: 'membership',
      reference_id: membershipId,
    },
  });

  logMemberships(eventId, 'info', 'visit_needed.owner_notified', {
    membershipId: shortIdForLog(membershipId),
    dedupeSuffix: suffix || null,
  });
}
