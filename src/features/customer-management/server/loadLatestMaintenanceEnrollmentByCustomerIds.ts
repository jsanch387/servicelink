import type { CustomerMaintenanceEnrollmentSummary } from '@/features/customer-management/types';
import { maintenanceDetailServiceLabel } from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type MaintenanceEnrollmentListRow = {
  id: string;
  customer_id: string;
  status: string | null;
  payment_status: string | null;
  service_name_snapshot: string | null;
  price_cents: number | null;
  frequency_weeks: number | null;
  duration_minutes: number | null;
  anchor_date: string | null;
  anchor_time: string | null;
  created_at: string | null;
  customer_invite_token?: string | null;
};

function rowToSummary(
  row: MaintenanceEnrollmentListRow
): CustomerMaintenanceEnrollmentSummary {
  return {
    enrollmentId: row.id,
    status: String(row.status ?? ''),
    paymentStatus: String(row.payment_status ?? ''),
    serviceNameSnapshot: maintenanceDetailServiceLabel(
      row.service_name_snapshot
    ),
    priceCents: Math.max(0, Math.round(Number(row.price_cents ?? 0))),
    frequencyWeeks: Math.max(0, Math.round(Number(row.frequency_weeks ?? 0))),
    durationMinutes: Math.max(0, Math.round(Number(row.duration_minutes ?? 0))),
    anchorDate: row.anchor_date ? String(row.anchor_date).trim() : null,
    anchorTime: row.anchor_time ? String(row.anchor_time).trim() : null,
    inviteToken: String(row.customer_invite_token ?? '').trim() || null,
  };
}

/**
 * Latest `maintenance_enrollments` row per customer (by `created_at` desc), for CRM list/detail.
 */
export async function loadLatestMaintenanceEnrollmentByCustomerIds(
  supabase: SupabaseClient<Database>,
  businessId: string,
  customerIds: string[]
): Promise<Map<string, CustomerMaintenanceEnrollmentSummary>> {
  const out = new Map<string, CustomerMaintenanceEnrollmentSummary>();
  if (customerIds.length === 0) return out;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as unknown as SupabaseClient<any>)
    .from('maintenance_enrollments')
    .select(
      'id, customer_id, status, payment_status, service_name_snapshot, price_cents, frequency_weeks, duration_minutes, anchor_date, anchor_time, created_at, customer_invite_token'
    )
    .eq('business_id', businessId)
    .in('customer_id', customerIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(
      '[customers] maintenance_enrollments load failed',
      businessId,
      error
    );
    return out;
  }

  const rows = (data ?? []) as MaintenanceEnrollmentListRow[];
  for (const row of rows) {
    const cid = String(row.customer_id ?? '').trim();
    if (!cid || out.has(cid)) continue;
    out.set(cid, rowToSummary(row));
  }
  return out;
}
