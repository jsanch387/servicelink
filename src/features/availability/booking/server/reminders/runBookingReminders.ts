/**
 * Daily reminder job: owner push + customer email/SMS.
 */

import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  runCustomerBookingReminders,
  type CustomerBookingRemindersRunResult,
} from './runCustomerBookingReminders';
import {
  runOwnerBookingReminders,
  type OwnerBookingRemindersRunResult,
} from './runOwnerBookingReminders';

export type BookingRemindersRunResult = {
  owner: OwnerBookingRemindersRunResult;
  customer: CustomerBookingRemindersRunResult;
};

export async function runBookingReminders(
  supabase: SupabaseClient<Database>,
  params?: {
    now?: Date;
    timeZone?: string;
    correlationId?: string | null;
    dryRun?: boolean;
    skipOwner?: boolean;
    skipCustomer?: boolean;
    onlyProfileId?: string | null;
    onlyCustomerEmail?: string | null;
  }
): Promise<BookingRemindersRunResult> {
  const shared = {
    now: params?.now,
    timeZone: params?.timeZone,
    correlationId: params?.correlationId,
  };

  const [owner, customer] = await Promise.all([
    runOwnerBookingReminders(supabase, {
      ...shared,
      dryRun: params?.dryRun || params?.skipOwner,
      onlyProfileId: params?.onlyProfileId,
    }),
    runCustomerBookingReminders(supabase, {
      ...shared,
      dryRun: params?.dryRun || params?.skipCustomer,
      onlyCustomerEmail: params?.onlyCustomerEmail,
    }),
  ]);

  return { owner, customer };
}
