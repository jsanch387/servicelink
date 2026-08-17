/**
 * Customer confirmation when a membership is canceled (owner or Customer Portal).
 * Idempotent via `metadata.cancel_confirmation_sent_key`.
 */

import { sendMembershipCanceledEmail } from '@/features/email/membership-canceled/sendMembershipCanceledEmail';
import type { MembershipCanceledEmailKind } from '@/features/email/membership-canceled/types';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isMembershipCancelScheduled,
  mapMembershipStatusToOwner,
} from './mapCustomerMembershipToOwnerSubscriber';
import {
  logMemberships,
  shortIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import {
  customerMembershipsOf,
  membershipPlansOf,
} from './membershipTablesQuery';

function asMeta(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function buildCancelConfirmationKey(args: {
  kind: MembershipCanceledEmailKind;
  accessUntilIso: string | null;
  canceledAtIso: string | null;
}): string {
  if (args.kind === 'immediate') {
    return `immediate:${args.canceledAtIso ?? 'now'}`;
  }
  return `at_period_end:${args.accessUntilIso ?? 'period'}`;
}

export async function sendMembershipCanceledEmailIfApplicable(
  _supabase: SupabaseClient<Database>,
  args: {
    membershipId: string;
    /** Only send when cancel is newly requested / ended. */
    previouslyCanceling: boolean;
    stripeEventId?: string | null;
  }
): Promise<void> {
  const mid = args.membershipId.trim();
  if (!mid) return;
  if (args.previouslyCanceling) return;

  const eventId = args.stripeEventId?.trim() || undefined;
  const admin = createSupabaseAdminClient();
  const { data: row, error } = await customerMembershipsOf(admin)
    .select('*')
    .eq('id', mid)
    .maybeSingle();

  if (error || !row) {
    logMemberships(eventId, 'warn', 'cancel_email.membership_missing', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(error),
    });
    return;
  }

  const status = mapMembershipStatusToOwner(String(row.status ?? ''));
  const cancelScheduled = isMembershipCancelScheduled(row);
  const nowCanceling = status === 'canceled' || cancelScheduled;
  if (!nowCanceling) return;

  const kind: MembershipCanceledEmailKind =
    status === 'canceled' && !cancelScheduled ? 'immediate' : 'at_period_end';

  const accessUntilIso =
    (typeof row.cancel_at === 'string' && row.cancel_at.trim()
      ? row.cancel_at.trim()
      : null) ||
    (typeof row.current_period_end === 'string' && row.current_period_end.trim()
      ? row.current_period_end.trim()
      : null);

  const canceledAtIso =
    typeof row.canceled_at === 'string' && row.canceled_at.trim()
      ? row.canceled_at.trim()
      : null;

  const sentKey = buildCancelConfirmationKey({
    kind,
    accessUntilIso,
    canceledAtIso,
  });

  const meta = asMeta(row.metadata);
  if (
    typeof meta.cancel_confirmation_sent_key === 'string' &&
    meta.cancel_confirmation_sent_key.trim() === sentKey
  ) {
    return;
  }

  const email = (row.customer_email as string | null)?.trim() || '';
  if (!email) {
    logMemberships(eventId, 'warn', 'cancel_email.no_email', {
      membershipId: shortIdForLog(mid),
    });
    return;
  }

  let planName = 'Your plan';
  if (row.plan_id) {
    const { data: plan } = await membershipPlansOf(admin)
      .select('name')
      .eq('id', row.plan_id as string)
      .maybeSingle();
    if (plan?.name?.trim()) planName = String(plan.name).trim();
  }

  const { data: business } = await admin
    .from('business_profiles')
    .select('business_name, business_slug')
    .eq('id', row.business_id as string)
    .maybeSingle();

  const biz = business as {
    business_name?: string | null;
    business_slug?: string | null;
  } | null;
  const businessName =
    biz?.business_name?.trim() || biz?.business_slug?.trim() || 'your provider';

  const mail = await sendMembershipCanceledEmail(email, {
    businessName,
    customerName: (row.customer_name as string | null)?.trim() || null,
    planName,
    kind,
    accessUntilIso: kind === 'at_period_end' ? accessUntilIso : null,
  });

  if (!mail.sent) {
    logMemberships(eventId, 'warn', 'cancel_email.send_failed', {
      membershipId: shortIdForLog(mid),
      reason: mail.error,
    });
    return;
  }

  const nextMeta: Json = {
    ...meta,
    cancel_confirmation_sent_key: sentKey,
    cancel_confirmation_sent_at: new Date().toISOString(),
  };

  const { error: metaErr } = await customerMembershipsOf(admin)
    .update({ metadata: nextMeta })
    .eq('id', mid);

  if (metaErr) {
    logMemberships(eventId, 'warn', 'cancel_email.meta_failed', {
      membershipId: shortIdForLog(mid),
      ...supabaseErrorForLogs(metaErr),
    });
  }
}
