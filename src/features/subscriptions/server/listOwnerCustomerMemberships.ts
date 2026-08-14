import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
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

type PlanSnapshot = {
  name: string;
  visitDurationMinutes?: number;
  removed: boolean;
};

/** Includes soft-deleted plans so history rows keep the real name. */
async function loadPlanSnapshotsForBusiness(
  businessId: string,
  planIds: string[]
): Promise<Map<string, PlanSnapshot>> {
  const snapshots = new Map<string, PlanSnapshot>();
  const ids = [...new Set(planIds.map(id => id.trim()).filter(Boolean))];
  if (ids.length === 0) return snapshots;

  const admin = createSupabaseAdminClient();
  const { data: plans } = await membershipPlansOf(admin)
    .select('id, name, visit_duration_minutes, deleted_at')
    .eq('business_id', businessId)
    .in('id', ids);

  for (const plan of plans ?? []) {
    const minutes = Number(
      (plan as { visit_duration_minutes?: number | null })
        .visit_duration_minutes
    );
    snapshots.set(String(plan.id), {
      name: String(plan.name ?? '').trim() || 'Plan',
      visitDurationMinutes:
        Number.isInteger(minutes) && minutes >= 30 ? minutes : undefined,
      removed: Boolean(
        (plan as { deleted_at?: string | null }).deleted_at
      ),
    });
  }
  return snapshots;
}

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

  const snapshots = await loadPlanSnapshotsForBusiness(bid, planIds);

  const subscribers = (rows ?? []).map(row => {
    const planId = String(row.plan_id ?? '').trim();
    const snapshot = planId ? snapshots.get(planId) : undefined;
    return mapCustomerMembershipToOwnerSubscriber(row, snapshot?.name ?? 'Plan', {
      visitDurationMinutes: snapshot?.visitDurationMinutes,
      planRemoved: !snapshot || snapshot.removed,
    });
  });

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

  const planId = (enriched.plan_id as string | null)?.trim();
  const snapshots = await loadPlanSnapshotsForBusiness(
    bid,
    planId ? [planId] : []
  );
  const snapshot = planId ? snapshots.get(planId) : undefined;
  const planName = snapshot?.name ?? 'Plan';
  const visitDurationMinutes = snapshot?.visitDurationMinutes;
  const planRemoved = !snapshot || snapshot.removed;

  const lastPaymentLabel = await latestInvoicePaymentLabel(
    supabase,
    mid,
    enriched.last_invoice_status
  );

  let periodVisitDate: string | null = null;
  let periodVisitTime: string | null = null;
  let periodVisitBookingStatus: string | null = null;
  const periodBookingId = (
    enriched.period_visit_booking_id as string | null
  )?.trim();
  if (periodBookingId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking } = await (supabase as any)
      .from('bookings')
      .select('scheduled_date, start_time, status')
      .eq('id', periodBookingId)
      .eq('business_id', bid)
      .maybeSingle();
    const br = booking as {
      scheduled_date?: string | null;
      start_time?: string | null;
      status?: string | null;
    } | null;
    periodVisitDate = br?.scheduled_date?.trim() || null;
    const rawTime = br?.start_time?.trim() || '';
    periodVisitTime = rawTime ? rawTime.slice(0, 5) : null;
    periodVisitBookingStatus = br?.status?.trim() || null;
  }

  return {
    ok: true,
    subscriber: mapCustomerMembershipToOwnerSubscriber(enriched, planName, {
      lastPaymentLabel,
      visitDurationMinutes,
      periodVisitDate,
      periodVisitTime,
      periodVisitBookingStatus,
      planRemoved,
    }),
  };
}
