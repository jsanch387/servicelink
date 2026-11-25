import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const RECENT_JOB_STATUSES = ['completed', 'upcoming', 'any'] as const;
export type RecentJobStatus = (typeof RECENT_JOB_STATUSES)[number];

type BookingRow = {
  id: string;
  status: string | null;
  scheduled_date: string | null;
  start_time: string | null;
  customer_id: string | null;
  customer_name: string | null;
  service_name: string | null;
  service_price_cents: number | null;
};

export type GetRecentJobsResult =
  | {
      ok: true;
      jobs: Array<{
        id: string;
        status: string;
        scheduledDate: string | null;
        startTime: string | null;
        customerId: string | null;
        customerName: string;
        serviceName: string;
        amountCents: number | null;
        hasReview: boolean;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetRecentJobs(args: {
  businessId: string;
  status?: RecentJobStatus;
  limit?: number;
  customerQuery?: string;
}): Promise<GetRecentJobsResult> {
  const status = args.status ?? 'completed';
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 10);
  const customerQuery = args.customerQuery?.trim().toLowerCase() ?? '';

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from('bookings')
      .select(
        'id, status, scheduled_date, start_time, customer_id, customer_name, service_name, service_price_cents'
      )
      .eq('business_id', args.businessId);

    if (status === 'completed') {
      query = query.eq('status', 'completed');
    } else if (status === 'upcoming') {
      query = query.eq('status', 'confirmed');
    } else {
      query = query.in('status', ['completed', 'confirmed']);
    }

    const ascending = status === 'upcoming';
    const { data, error } = await query
      .order('scheduled_date', { ascending })
      .order('start_time', { ascending })
      .limit(40);

    if (error) {
      console.error('[assistant:chat] getRecentJobs', error);
      return { ok: false, error: 'Could not load recent jobs right now.' };
    }

    let rows = (data ?? []) as BookingRow[];
    if (customerQuery) {
      rows = rows.filter(row =>
        (row.customer_name ?? '').toLowerCase().includes(customerQuery)
      );
    }
    rows = rows.slice(0, limit);

    const customerIds = [
      ...new Set(
        rows
          .map(row => row.customer_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const reviewed = new Set<string>();
    if (customerIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewRows } = await (admin as any)
        .from('reviews')
        .select('customer_id')
        .eq('business_id', args.businessId)
        .in('customer_id', customerIds);
      for (const row of (reviewRows ?? []) as {
        customer_id: string | null;
      }[]) {
        if (row.customer_id) reviewed.add(row.customer_id);
      }
    }

    return {
      ok: true,
      jobs: rows.map(row => ({
        id: row.id,
        status: row.status?.trim() || 'unknown',
        scheduledDate: row.scheduled_date,
        startTime: row.start_time,
        customerId: row.customer_id,
        customerName: row.customer_name?.trim() || 'Customer',
        serviceName: row.service_name?.trim() || 'Service',
        amountCents:
          typeof row.service_price_cents === 'number'
            ? row.service_price_cents
            : null,
        hasReview: row.customer_id ? reviewed.has(row.customer_id) : false,
      })),
    };
  } catch (error) {
    console.error('[assistant:chat] getRecentJobs', error);
    return { ok: false, error: 'Could not load recent jobs right now.' };
  }
}
