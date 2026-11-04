import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CANDIDATE_PAGE,
  CANDIDATE_PAGE_LIMIT,
  SETUP_EMAIL_SEND_BATCH,
  SETUP_EMAIL_SEND_CONCURRENCY,
  SETUP_LOOKBACK_MS,
  TEST_APPOINTMENT_DELAY_MS,
  TEST_APPOINTMENT_KEY,
} from '../constants';
import { decideTestAppointmentEmail } from '../eligibility';

type Admin = SupabaseClient<Database>;

function tables(admin: Admin): SupabaseClient {
  return admin as unknown as SupabaseClient;
}

export interface TestAppointmentProfile {
  user_id: string;
  onboarding_status: 'completed';
  created_at: string;
}

const MISSING_COLUMN = '42703';

/**
 * Owners who finished at least a day ago, still have no bookings, and have
 * not been sent the test-appointment note. Stops once the send batch is full.
 */
export async function loadTestAppointmentDue(
  admin: Admin,
  now: Date
): Promise<{ examined: number; due: TestAppointmentProfile[] }> {
  const due: TestAppointmentProfile[] = [];
  let examined = 0;

  for (let page = 0; page < CANDIDATE_PAGE_LIMIT; page += 1) {
    const rows = await loadCompletedPage(admin, now, page);
    if (rows === null) return { examined, due };
    examined += rows.length;

    const sent = await loadSent(
      admin,
      rows.map(row => row.user_id)
    );
    const businesses = await loadBusinesses(
      admin,
      rows.map(row => row.user_id)
    );
    const pending = rows.filter(row => {
      if (sent.has(row.user_id)) return false;
      return Boolean(businesses.get(row.user_id)?.id);
    });

    const checks = await mapWithConcurrency(
      pending,
      SETUP_EMAIL_SEND_CONCURRENCY,
      async row => {
        const business = businesses.get(row.user_id);
        if (!business) return null;
        const hasBooking = await hasAnyBooking(admin, business.id);
        return decideTestAppointmentEmail(
          {
            completedAt: new Date(row.onboarding_completed_at),
            alreadySent: false,
            hasBooking,
          },
          now
        )
          ? row
          : null;
      }
    );

    for (const row of checks) {
      if (!row) continue;
      due.push({
        user_id: row.user_id,
        onboarding_status: 'completed',
        created_at: row.created_at,
      });
    }

    if (rows.length < CANDIDATE_PAGE) break;
    if (due.length >= SETUP_EMAIL_SEND_BATCH) break;
  }

  return { examined, due };
}

/** One owner, for the test curl. `force` skips the one-day wait. */
export async function loadTestAppointmentForUser(
  admin: Admin,
  userId: string,
  now: Date,
  force: boolean
): Promise<TestAppointmentProfile | null> {
  const sent = await loadSent(admin, [userId]);
  if (sent.has(userId)) return null;

  const businesses = await loadBusinesses(admin, [userId]);
  const business = businesses.get(userId);
  if (!business) return null;

  const hasBooking = await hasAnyBooking(admin, business.id);
  if (hasBooking) return null;

  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, created_at, onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (error.code === MISSING_COLUMN)
      return force ? placeholder(userId) : null;
    throw error;
  }
  const row = data as {
    user_id: string;
    created_at: string;
    onboarding_completed_at: string | null;
  } | null;
  if (!row) return null;

  if (force) {
    return {
      user_id: row.user_id,
      onboarding_status: 'completed',
      created_at: row.created_at,
    };
  }

  const key = decideTestAppointmentEmail(
    {
      completedAt: row.onboarding_completed_at
        ? new Date(row.onboarding_completed_at)
        : null,
      alreadySent: false,
      hasBooking: false,
    },
    now
  );
  if (!key) return null;
  return {
    user_id: row.user_id,
    onboarding_status: 'completed',
    created_at: row.created_at,
  };
}

async function hasAnyBooking(
  admin: Admin,
  businessId: string
): Promise<boolean> {
  const { data, error } = await tables(admin)
    .from('bookings')
    .select('id')
    .eq('business_id', businessId)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

function placeholder(userId: string): TestAppointmentProfile {
  return {
    user_id: userId,
    onboarding_status: 'completed',
    created_at: new Date(0).toISOString(),
  };
}

interface CompletedRow {
  user_id: string;
  created_at: string;
  onboarding_completed_at: string;
}

async function loadCompletedPage(
  admin: Admin,
  now: Date,
  page: number
): Promise<CompletedRow[] | null> {
  const windowStart = new Date(now.getTime() - SETUP_LOOKBACK_MS);
  const readyAt = new Date(now.getTime() - TEST_APPOINTMENT_DELAY_MS);
  const from = page * CANDIDATE_PAGE;
  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, created_at, onboarding_completed_at')
    .eq('onboarding_status', 'completed')
    .gte('onboarding_completed_at', windowStart.toISOString())
    .lte('onboarding_completed_at', readyAt.toISOString())
    .order('onboarding_completed_at', { ascending: true })
    .range(from, from + CANDIDATE_PAGE - 1);

  if (error) {
    if (error.code === MISSING_COLUMN) return null;
    throw error;
  }
  return (data ?? []) as CompletedRow[];
}

async function loadSent(admin: Admin, userIds: string[]): Promise<Set<string>> {
  const sent = new Set<string>();
  if (userIds.length === 0) return sent;
  const { data, error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('user_id')
    .in('user_id', userIds)
    .eq('email_key', TEST_APPOINTMENT_KEY);
  if (error) throw error;
  for (const row of (data ?? []) as { user_id: string }[]) {
    sent.add(row.user_id);
  }
  return sent;
}

async function loadBusinesses(
  admin: Admin,
  userIds: string[]
): Promise<Map<string, { id: string }>> {
  const found = new Map<string, { id: string; created_at: string }>();
  if (userIds.length === 0) return new Map();
  const { data, error } = await tables(admin)
    .from('business_profiles')
    .select('id, profile_id, created_at')
    .in('profile_id', userIds);
  if (error) throw error;
  for (const row of (data ?? []) as {
    id: string;
    profile_id: string;
    created_at: string;
  }[]) {
    const current = found.get(row.profile_id);
    if (!current || row.created_at < current.created_at) {
      found.set(row.profile_id, { id: row.id, created_at: row.created_at });
    }
  }
  return new Map(
    [...found.entries()].map(([profileId, business]) => [
      profileId,
      { id: business.id },
    ])
  );
}
