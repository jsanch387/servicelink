/**
 * Owner in-app + push when a customer first becomes a subscriber.
 * Best-effort; webhook retries are safe via notifications.dedupe_key.
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
import { membershipPlansOf } from './membershipTablesQuery';

export async function notifyOwnerForNewMembershipSubscriber(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId: string;
    customerName: string | null;
    planId?: string | null;
    stripeEventId?: string | null;
  }
): Promise<void> {
  const businessId = args.businessId.trim();
  const membershipId = args.membershipId.trim();
  if (!businessId || !membershipId) return;

  const eventId = args.stripeEventId?.trim() || undefined;

  const { data: profileRow, error: bizError } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();

  const profileId =
    (profileRow as { profile_id?: string | null } | null)?.profile_id?.trim() ||
    '';

  if (bizError || !profileId) {
    logMemberships(eventId, 'warn', 'new_subscriber.notify_skip', {
      membershipId: shortIdForLog(membershipId),
      businessId: shortIdForLog(businessId),
      reason: bizError ? 'business_lookup_failed' : 'no_owner_profile',
      ...supabaseErrorForLogs(bizError),
    });
    return;
  }

  let planName: string | null = null;
  const planId = args.planId?.trim();
  if (planId) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name')
      .eq('id', planId)
      .maybeSingle();
    const name = plan?.name?.trim();
    if (name) planName = name;
  }

  const title = notificationMinimalDisplayTitle(
    'membership_subscriber',
    'membership',
    'New subscriber',
    'New subscriber'
  );
  const customerName = args.customerName?.trim() || 'A customer';
  const bodyText = planName
    ? `${customerName} subscribed to ${planName}`
    : `${customerName} subscribed`;

  const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
    {
      user_id: profileId,
      type: 'membership_subscriber',
      reference_type: 'membership',
      reference_id: membershipId,
      title,
      body: bodyText,
      dedupe_key: `membership_subscriber:${membershipId}`,
    };

  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notificationRow as never);

  if (notifError) {
    // Unique dedupe_key → webhook retry; anything else is a real failure.
    const code =
      typeof notifError === 'object' &&
      notifError &&
      'code' in notifError &&
      typeof (notifError as { code?: unknown }).code === 'string'
        ? (notifError as { code: string }).code
        : '';
    if (code !== '23505') {
      logMemberships(eventId, 'warn', 'new_subscriber.notification_failed', {
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
}
