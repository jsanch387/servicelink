import {
  mondayOfContainingWeek,
  shiftYmd,
} from '@/features/payments/revenue/zonedDateTime';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

import { todayYmd } from './chatPeriodRange';

export const JOBS_SUMMARY_RANGES = ['today', 'week'] as const;
export type JobsSummaryRange = (typeof JOBS_SUMMARY_RANGES)[number];

type BookingRow = {
  id: string;
  status: string | null;
  scheduled_date: string | null;
  start_time: string | null;
  customer_name: string | null;
  service_name: string | null;
};

export type GetJobsSummaryResult =
  | {
      ok: true;
      range: JobsSummaryRange;
      fromYmd: string;
      toYmd: string;
      confirmedCount: number;
      completedCount: number;
      cancelledCount: number;
      upcoming: Array<{
        scheduledDate: string;
        startTime: string | null;
        customerName: string;
        serviceName: string;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetJobsSummary(args: {
  businessId: string;
  range: JobsSummaryRange;
  now?: Date;
}): Promise<GetJobsSummaryResult> {
  const now = args.now ?? new Date();
  const today = todayYmd(now);
  const fromYmd =
    args.range === 'today' ? today : mondayOfContainingWeek(today);
  const toYmd = args.range === 'today' ? today : shiftYmd(fromYmd, 6);

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('bookings')
      .select(
        'id, status, scheduled_date, start_time, customer_name, service_name'
      )
      .eq('business_id', args.businessId)
      .gte('scheduled_date', fromYmd)
      .lte('scheduled_date', toYmd)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(200);

    if (error) {
      console.error('[assistant:chat] getJobsSummary', error);
      return { ok: false, error: 'Could not load the schedule right now.' };
    }

    const rows = (data ?? []) as BookingRow[];
    let confirmedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    const upcoming: Array<{
      scheduledDate: string;
      startTime: string | null;
      customerName: string;
      serviceName: string;
    }> = [];

    for (const row of rows) {
      const status = row.status?.trim() ?? '';
      if (status === 'confirmed') confirmedCount += 1;
      else if (status === 'completed') completedCount += 1;
      else if (status === 'cancelled') cancelledCount += 1;

      if (
        status === 'confirmed' &&
        row.scheduled_date &&
        upcoming.length < 10
      ) {
        upcoming.push({
          scheduledDate: row.scheduled_date,
          startTime: row.start_time,
          customerName: row.customer_name?.trim() || 'Customer',
          serviceName: row.service_name?.trim() || 'Service',
        });
      }
    }

    return {
      ok: true,
      range: args.range,
      fromYmd,
      toYmd,
      confirmedCount,
      completedCount,
      cancelledCount,
      upcoming,
    };
  } catch (error) {
    console.error('[assistant:chat] getJobsSummary', error);
    return { ok: false, error: 'Could not load the schedule right now.' };
  }
}
