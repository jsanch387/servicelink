import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import { enrichOwnerMembershipFromStripe } from './enrichOwnerMembershipFromStripe';
import {
  formatLastPaymentLabel,
  mapCustomerMembershipToOwnerSubscriber,
} from './mapCustomerMembershipToOwnerSubscriber';
import {
  customerMembershipsOf,
  membershipInvoicesOf,
  membershipPlansOf,
} from './membershipTablesQuery';

export type ListOwnerCustomerMembershipsResult =
  | { ok: true; subscribers: OwnerSubscriber[] }
  | { ok: false; error: string };

export async function listOwnerCustomerMemberships(
  supabase: SupabaseClient<Database>,
  businessId: string,
  opts?: { planId?: string | null }
): Promise<ListOwnerCustomerMembershipsResult> {
  const bid = businessId.trim();
  if (!bid) return { ok: false, error: 'Missing business id.' };

  let query = customerMembershipsOf(supabase)
    .select('*')
    .eq('business_id', bid)
    .order('created_at', { ascending: false });

  const planId = opts?.planId?.trim();
  if (planId) query = query.eq('plan_id', planId);

  const { data: rows, error } = await query;
  if (error) {
    return { ok: false, error: 'Failed to load subscribers.' };
  }

  const planIds = [
    ...new Set(
      (rows ?? [])
        .map(r => (r.plan_id as string | null)?.trim() || '')
        .filter(Boolean)
    ),
  ];

  const planNameById = new Map<string, string>();
  if (planIds.length > 0) {
    const { data: plans } = await membershipPlansOf(supabase)
      .select('id, name')
      .in('id', planIds);
    for (const plan of plans ?? []) {
      planNameById.set(String(plan.id), String(plan.name ?? 'Plan'));
    }
  }

  const subscribers = (rows ?? []).map(row =>
    mapCustomerMembershipToOwnerSubscriber(
      row,
      planNameById.get(String(row.plan_id ?? '')) ?? 'Plan'
    )
  );

  return { ok: true, subscribers };
}

async function latestInvoicePaymentLabel(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  fallbackStatus: string | null
): Promise<string | undefined> {
  const { data: invoice } = await membershipInvoicesOf(supabase)
    .select('status, paid_at, amount_paid_cents')
    .eq('membership_id', membershipId)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!invoice) {
    return formatLastPaymentLabel({ invoiceStatus: fallbackStatus });
  }

  return formatLastPaymentLabel({
    invoiceStatus: invoice.status ?? fallbackStatus,
    paidAtIso: invoice.paid_at,
    amountPaidCents: invoice.amount_paid_cents,
  });
}

export async function getOwnerCustomerMembership(
  supabase: SupabaseClient<Database>,
  businessId: string,
  membershipId: string
): Promise<
  | { ok: true; subscriber: OwnerSubscriber }
  | { ok: false; error: string; status: number }
> {
  const bid = businessId.trim();
  const mid = membershipId.trim();
  if (!bid || !mid) {
    return { ok: false, error: 'Missing id.', status: 400 };
  }

  const { data: row, error } = await customerMembershipsOf(supabase)
    .select('*')
    .eq('business_id', bid)
    .eq('id', mid)
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'Failed to load subscriber.', status: 500 };
  }
  if (!row) {
    return { ok: false, error: 'Subscriber not found.', status: 404 };
  }

  const enriched = await enrichOwnerMembershipFromStripe(supabase, row);

  let planName = 'Plan';
  const planId = (enriched.plan_id as string | null)?.trim();
  if (planId) {
    const { data: plan } = await membershipPlansOf(supabase)
      .select('name')
      .eq('id', planId)
      .maybeSingle();
    if (plan?.name) planName = String(plan.name);
  }

  const lastPaymentLabel = await latestInvoicePaymentLabel(
    supabase,
    mid,
    enriched.last_invoice_status
  );

  return {
    ok: true,
    subscriber: mapCustomerMembershipToOwnerSubscriber(enriched, planName, {
      lastPaymentLabel,
    }),
  };
}
