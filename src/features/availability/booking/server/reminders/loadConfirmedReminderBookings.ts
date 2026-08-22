import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import type { Database } from '@/libs/supabase/client';
import { supabaseErrorForLogs } from '@/server/logging/structuredLog';
import type { SupabaseClient } from '@supabase/supabase-js';

const PAGE_SIZE = 200;

export type ReminderBookingRow = {
  id: string;
  business_id: string;
  scheduled_date: string;
  start_time: string;
  service_name: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_id: string | null;
};

const BOOKING_COLUMNS =
  'id, business_id, scheduled_date, start_time, service_name, customer_name, customer_email, customer_phone, customer_id';

export async function loadConfirmedReminderBookings(
  supabase: SupabaseClient<Database>,
  scheduledDate: string
): Promise<ReminderBookingRow[] | null> {
  const rows: ReminderBookingRow[] = [];
  let offset = 0;

  // `bookings` is not in the generated Database type yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  while (true) {
    const { data, error } = await db
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('status', 'confirmed')
      .eq('scheduled_date', scheduledDate)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logAvailabilityOwnerNotify(
        undefined,
        'warn',
        'reminder_bookings_page_failed',
        {
          scheduledDate,
          offset,
          ...supabaseErrorForLogs(error),
        }
      );
      return null;
    }

    const page = (data ?? []) as ReminderBookingRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return rows;
}

export type ReminderBusiness = {
  profileId: string;
  businessName: string;
};

export async function loadReminderBusinesses(
  supabase: SupabaseClient<Database>,
  businessIds: string[]
): Promise<Map<string, ReminderBusiness>> {
  const unique = [...new Set(businessIds.map(id => id.trim()).filter(Boolean))];
  const map = new Map<string, ReminderBusiness>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, profile_id, business_name')
    .in('id', unique);

  if (error) {
    logAvailabilityOwnerNotify(
      undefined,
      'warn',
      'reminder_businesses_query_failed',
      {
        ...supabaseErrorForLogs(error),
      }
    );
    return map;
  }

  const rows = (data ?? []) as Array<{
    id?: string | null;
    profile_id?: string | null;
    business_name?: string | null;
  }>;
  for (const row of rows) {
    const id = row.id?.trim();
    const profileId = row.profile_id?.trim();
    if (!id || !profileId) continue;
    map.set(id, {
      profileId,
      businessName: row.business_name?.trim() || '',
    });
  }

  return map;
}
