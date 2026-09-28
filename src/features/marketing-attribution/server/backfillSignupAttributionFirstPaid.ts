/**
 * One-time backfill for billed active Pros.
 * Inserts a missing `signup_attribution` row as channel `unknown` and sets
 * `first_paid_at` from the first paid Stripe invoice, then subscription
 * `start_date`. Does not send welcome emails or Meta Subscribe.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { toSignupAttributionRow } from './parseMarketingAttribution';

export type BackfillBucketSummary = {
  billedActive: number;
  noAttributionRow: number;
  rowNullFirstPaidAt: number;
  alreadyStamped: number;
  wouldInsertUnknown: number;
  wouldSetFirstPaidAt: number;
  skippedNoStripeSubscription: number;
};

type ProfileBackfillRow = {
  user_id: string;
  created_at: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
};

type AttributionBackfillRow = {
  user_id: string;
  first_paid_at: string | null;
};

export type BackfillCandidate = {
  userId: string;
  createdAt: string;
  stripeSubscriptionId: string;
  bucket: 'no_row' | 'null_first_paid';
};

export function summarizeBackfillBuckets(input: {
  billedActive: number;
  noAttributionRow: number;
  rowNullFirstPaidAt: number;
  alreadyStamped: number;
  skippedNoStripeSubscription: number;
}): BackfillBucketSummary {
  return {
    billedActive: input.billedActive,
    noAttributionRow: input.noAttributionRow,
    rowNullFirstPaidAt: input.rowNullFirstPaidAt,
    alreadyStamped: input.alreadyStamped,
    wouldInsertUnknown: input.noAttributionRow,
    wouldSetFirstPaidAt: input.noAttributionRow + input.rowNullFirstPaidAt,
    skippedNoStripeSubscription: input.skippedNoStripeSubscription,
  };
}

/** Earliest paid invoice, otherwise the subscription start date. */
export function resolveStripeFirstPaidAtIso(input: {
  subscriptionStartDateUnix?: number | null;
  paidInvoiceUnix?: Array<number | null | undefined>;
}): string | null {
  const paid = (input.paidInvoiceUnix ?? []).filter(
    (value): value is number => typeof value === 'number' && value > 0
  );
  const earliestPaid = paid.length > 0 ? Math.min(...paid) : null;
  const start =
    typeof input.subscriptionStartDateUnix === 'number' &&
    input.subscriptionStartDateUnix > 0
      ? input.subscriptionStartDateUnix
      : null;
  const seconds = earliestPaid ?? start;
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function isActivePro(row: ProfileBackfillRow): boolean {
  return (
    (row.subscription_tier ?? '').trim().toLowerCase() === 'pro' &&
    (row.subscription_status ?? '').trim().toLowerCase() === 'active'
  );
}

async function listProfiles(
  admin: SupabaseClient
): Promise<ProfileBackfillRow[]> {
  const pageSize = 1000;
  const rows: ProfileBackfillRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('profiles')
      .select(
        'user_id, created_at, subscription_tier, subscription_status, stripe_subscription_id'
      )
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as ProfileBackfillRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function loadAttributionByUserId(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, AttributionBackfillRow>> {
  const byUserId = new Map<string, AttributionBackfillRow>();
  const chunkSize = 200;
  for (let index = 0; index < userIds.length; index += chunkSize) {
    const chunk = userIds.slice(index, index + chunkSize);
    const { data, error } = await admin
      .from('signup_attribution')
      .select('user_id, first_paid_at')
      .in('user_id', chunk);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as AttributionBackfillRow[]) {
      byUserId.set(row.user_id, row);
    }
  }
  return byUserId;
}

async function listPaidInvoiceUnix(
  stripe: Stripe,
  subscriptionId: string
): Promise<number[]> {
  const paid: number[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const list = await stripe.invoices.list({
      subscription: subscriptionId,
      status: 'paid',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const invoice of list.data) {
      const paidAt = invoice.status_transitions?.paid_at;
      if (typeof paidAt === 'number' && paidAt > 0) paid.push(paidAt);
    }
    if (!list.has_more || list.data.length === 0) break;
    startingAfter = list.data[list.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return paid;
}

export type SignupAttributionBackfillReport = BackfillBucketSummary & {
  dryRun: boolean;
  inserted: number;
  stamped: number;
  missingStripeDate: number;
  stripeErrors: number;
};

export async function runSignupAttributionFirstPaidBackfill(options: {
  admin: SupabaseClient;
  stripe: Stripe | null;
  dryRun: boolean;
}): Promise<SignupAttributionBackfillReport> {
  const profiles = await listProfiles(options.admin);
  const activePros = profiles.filter(isActivePro);
  const skippedNoStripeSubscription = activePros.filter(
    row => !row.stripe_subscription_id?.trim()
  ).length;
  const billed = activePros.filter(row =>
    Boolean(row.stripe_subscription_id?.trim())
  );
  const attribution = await loadAttributionByUserId(
    options.admin,
    billed.map(row => row.user_id)
  );

  let noAttributionRow = 0;
  let rowNullFirstPaidAt = 0;
  let alreadyStamped = 0;
  const candidates: BackfillCandidate[] = [];

  for (const profile of billed) {
    const row = attribution.get(profile.user_id);
    if (!row) {
      noAttributionRow += 1;
      candidates.push({
        userId: profile.user_id,
        createdAt: profile.created_at?.trim() || new Date().toISOString(),
        stripeSubscriptionId: profile.stripe_subscription_id!.trim(),
        bucket: 'no_row',
      });
      continue;
    }
    if (!row.first_paid_at) {
      rowNullFirstPaidAt += 1;
      candidates.push({
        userId: profile.user_id,
        createdAt: profile.created_at?.trim() || new Date().toISOString(),
        stripeSubscriptionId: profile.stripe_subscription_id!.trim(),
        bucket: 'null_first_paid',
      });
      continue;
    }
    alreadyStamped += 1;
  }

  const summary = summarizeBackfillBuckets({
    billedActive: billed.length,
    noAttributionRow,
    rowNullFirstPaidAt,
    alreadyStamped,
    skippedNoStripeSubscription,
  });

  if (options.dryRun) {
    return {
      ...summary,
      dryRun: true,
      inserted: 0,
      stamped: 0,
      missingStripeDate: 0,
      stripeErrors: 0,
    };
  }

  if (!options.stripe) {
    throw new Error('Stripe client is required when applying the backfill');
  }

  let inserted = 0;
  let stamped = 0;
  let missingStripeDate = 0;
  let stripeErrors = 0;

  for (const candidate of candidates) {
    let firstPaidAt: string | null = null;
    try {
      const subscription = await options.stripe.subscriptions.retrieve(
        candidate.stripeSubscriptionId
      );
      const paidInvoiceUnix = await listPaidInvoiceUnix(
        options.stripe,
        candidate.stripeSubscriptionId
      );
      firstPaidAt = resolveStripeFirstPaidAtIso({
        subscriptionStartDateUnix: subscription.start_date,
        paidInvoiceUnix,
      });
    } catch (error) {
      stripeErrors += 1;
      console.error('[attribution-backfill] stripe lookup failed', {
        userId: candidate.userId,
        error,
      });
      continue;
    }

    if (!firstPaidAt) {
      missingStripeDate += 1;
      continue;
    }

    if (candidate.bucket === 'no_row') {
      const { error: insertError } = await options.admin
        .from('signup_attribution')
        .insert({
          user_id: candidate.userId,
          ...toSignupAttributionRow(undefined),
          signed_up_at: candidate.createdAt,
          first_paid_at: firstPaidAt,
        } as never);
      if (insertError?.code === '23505') {
        const { data: claimed, error: stampError } = await options.admin
          .from('signup_attribution')
          .update({ first_paid_at: firstPaidAt })
          .eq('user_id', candidate.userId)
          .is('first_paid_at', null)
          .select('user_id');
        if (stampError) throw new Error(stampError.message);
        if (claimed?.length) stamped += 1;
        continue;
      }
      if (insertError) throw new Error(insertError.message);
      inserted += 1;
      stamped += 1;
      continue;
    }

    const { data: claimed, error: stampError } = await options.admin
      .from('signup_attribution')
      .update({ first_paid_at: firstPaidAt })
      .eq('user_id', candidate.userId)
      .is('first_paid_at', null)
      .select('user_id');
    if (stampError) throw new Error(stampError.message);
    if (claimed?.length) stamped += 1;
  }

  return {
    ...summary,
    dryRun: false,
    inserted,
    stamped,
    missingStripeDate,
    stripeErrors,
  };
}
