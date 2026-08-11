import type { Database, Json } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  logMemberships,
  shortIdForLog,
  shortStripeIdForLog,
  supabaseErrorForLogs,
} from './membershipsTransactionLog';
import { membershipEventsOf } from './membershipTablesQuery';

export type MembershipEventType =
  | 'checkout_completed'
  | 'subscription_created'
  | 'subscription_updated'
  | 'invoice_paid'
  | 'invoice_payment_failed'
  | 'cancel_requested'
  | 'canceled'
  | 'payment_method_updated'
  | 'other';

/**
 * Append-only event. Duplicate `stripe_event_id` is treated as success (idempotent).
 */
export async function recordMembershipEvent(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    membershipId?: string | null;
    eventType: MembershipEventType;
    stripeEventId?: string | null;
    stripeAccountId?: string | null;
    summary?: string | null;
    payload?: Json;
    occurredAt?: string | null;
  }
): Promise<{ ok: true; duplicate?: boolean } | { ok: false; error: string }> {
  const { error } = await membershipEventsOf(supabase).insert({
    business_id: args.businessId,
    membership_id: args.membershipId ?? null,
    event_type: args.eventType,
    stripe_event_id: args.stripeEventId?.trim() || null,
    stripe_account_id: args.stripeAccountId?.trim() || null,
    summary: args.summary?.trim() || null,
    payload: args.payload ?? {},
    ...(args.occurredAt ? { occurred_at: args.occurredAt } : {}),
  });

  if (!error) return { ok: true };

  if (error.code === '23505') {
    return { ok: true, duplicate: true };
  }

  logMemberships(
    args.stripeEventId ?? undefined,
    'error',
    'event.insert_failed',
    {
      businessId: shortIdForLog(args.businessId),
      membershipId: shortIdForLog(args.membershipId),
      eventType: args.eventType,
      stripeEventId: shortStripeIdForLog(args.stripeEventId),
      reason: 'membership_events insert failed',
      ...supabaseErrorForLogs(error),
    }
  );
  return { ok: false, error: error.message };
}
