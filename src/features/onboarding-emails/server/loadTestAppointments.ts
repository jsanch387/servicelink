import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import { calendarDateInTimeZone } from '@/features/availability/booking/server/reminders/ownerBookingReminderDate';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CANDIDATE_PAGE,
  CANDIDATE_PAGE_LIMIT,
  ONBOARDING_EMAIL_TIMEZONE,
  QR_CODE_DELAY_MS,
  QR_CODE_KEY,
  RECEIPT_REVIEW_AFTER_ASK_MS,
  RECEIPT_REVIEW_KEY,
  SETUP_EMAIL_SEND_BATCH,
  SETUP_EMAIL_SEND_CONCURRENCY,
  SETUP_LOOKBACK_MS,
  TEST_APPOINTMENT_DELAY_MS,
  TEST_APPOINTMENT_KEY,
} from '../constants';
import {
  decideQrCodeEmail,
  decideReceiptReviewEmail,
  decideTestAppointmentEmail,
} from '../eligibility';

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

/**
 * Owners who already got the first-appointment email, still have no booking,
 * and are three days past that send. Stops once the send batch is full.
 */
export async function loadReceiptReviewDue(
  admin: Admin,
  now: Date
): Promise<{ examined: number; due: TestAppointmentProfile[] }> {
  const due: TestAppointmentProfile[] = [];
  let examined = 0;
  const today = calendarDateInTimeZone(now, ONBOARDING_EMAIL_TIMEZONE);

  for (let page = 0; page < CANDIDATE_PAGE_LIMIT; page += 1) {
    const asks = await loadAskPage(admin, now, page);
    examined += asks.length;
    const pending = asks.filter(row => !row.followUpSent);
    const businesses = await loadBusinesses(
      admin,
      pending.map(row => row.user_id)
    );
    const checks = await mapWithConcurrency(
      pending.filter(row => businesses.has(row.user_id)),
      SETUP_EMAIL_SEND_CONCURRENCY,
      async row => {
        const business = businesses.get(row.user_id);
        if (!business) return null;
        const hasBooking = await hasAnyBooking(admin, business.id);
        const key = decideReceiptReviewEmail(
          {
            askSentAt: new Date(row.sent_at),
            askSentOn: calendarDateInTimeZone(
              new Date(row.sent_at),
              ONBOARDING_EMAIL_TIMEZONE
            ),
            today,
            alreadySent: false,
            hasBooking,
          },
          now
        );
        return key ? row : null;
      }
    );

    for (const row of checks) {
      if (!row) continue;
      due.push({
        user_id: row.user_id,
        onboarding_status: 'completed',
        created_at: row.sent_at,
      });
    }

    if (asks.length < CANDIDATE_PAGE) break;
    if (due.length >= SETUP_EMAIL_SEND_BATCH) break;
  }

  return { examined, due };
}

/**
 * Owners whose first booking is at least a day old and who have not been
 * sent the QR note. Stops once the send batch is full.
 */
export async function loadQrCodeDue(
  admin: Admin,
  now: Date
): Promise<{ examined: number; due: TestAppointmentProfile[] }> {
  const due: TestAppointmentProfile[] = [];
  let examined = 0;
  const seenBusinesses = new Set<string>();
  const today = calendarDateInTimeZone(now, ONBOARDING_EMAIL_TIMEZONE);

  for (let page = 0; page < CANDIDATE_PAGE_LIMIT; page += 1) {
    const bookings = await loadBookingPage(admin, now, page);
    examined += bookings.length;
    const firsts = bookings.filter(row => {
      if (seenBusinesses.has(row.business_id)) return false;
      seenBusinesses.add(row.business_id);
      return true;
    });
    const owners = await loadOwnersForBusinesses(
      admin,
      firsts.map(row => row.business_id)
    );
    const userIds = [...owners.values()].map(owner => owner.userId);
    const alreadySent = await loadSentForKey(admin, userIds, QR_CODE_KEY);
    const windowStart = now.getTime() - SETUP_LOOKBACK_MS;
    const readyAt = now.getTime() - QR_CODE_DELAY_MS;
    const queuedUsers = new Set(due.map(row => row.user_id));
    const checks = await mapWithConcurrency(
      firsts,
      SETUP_EMAIL_SEND_CONCURRENCY,
      async row => {
        const owner = owners.get(row.business_id);
        if (
          !owner ||
          alreadySent.has(owner.userId) ||
          queuedUsers.has(owner.userId)
        ) {
          return null;
        }
        const firstBookingAt = await loadFirstBookingAt(admin, row.business_id);
        if (!firstBookingAt) return null;
        const bookedAt = firstBookingAt.getTime();
        if (bookedAt < windowStart || bookedAt > readyAt) return null;
        const key = decideQrCodeEmail(
          {
            firstBookingAt,
            firstBookingOn: calendarDateInTimeZone(
              firstBookingAt,
              ONBOARDING_EMAIL_TIMEZONE
            ),
            today,
            alreadySent: false,
          },
          now
        );
        if (!key) return null;
        return {
          userId: owner.userId,
          createdAt: firstBookingAt.toISOString(),
        };
      }
    );

    for (const row of checks) {
      if (!row || queuedUsers.has(row.userId)) continue;
      queuedUsers.add(row.userId);
      due.push({
        user_id: row.userId,
        onboarding_status: 'completed',
        created_at: row.createdAt,
      });
    }

    if (bookings.length < CANDIDATE_PAGE) break;
    if (due.length >= SETUP_EMAIL_SEND_BATCH) break;
  }

  return { examined, due };
}

/** One owner, for the test curl. `force` skips the wait and sends the next unsent note. */
export async function loadTestAppointmentForUser(
  admin: Admin,
  userId: string,
  now: Date,
  force: boolean
): Promise<{
  profile: TestAppointmentProfile;
  key:
    | typeof TEST_APPOINTMENT_KEY
    | typeof RECEIPT_REVIEW_KEY
    | typeof QR_CODE_KEY;
} | null> {
  const sent = await loadSentKeys(admin, userId);

  const businesses = await loadBusinesses(admin, [userId]);
  const business = businesses.get(userId);
  if (!business) return null;

  const firstBookingAt = await loadFirstBookingAt(admin, business.id);
  if (firstBookingAt) {
    if (sent.qr) return null;
    const profile = await loadCompletedProfile(admin, userId);
    if (!profile) {
      return force ? { profile: placeholder(userId), key: QR_CODE_KEY } : null;
    }
    if (!force) {
      const key = decideQrCodeEmail(
        {
          firstBookingAt,
          firstBookingOn: calendarDateInTimeZone(
            firstBookingAt,
            ONBOARDING_EMAIL_TIMEZONE
          ),
          today: calendarDateInTimeZone(now, ONBOARDING_EMAIL_TIMEZONE),
          alreadySent: false,
        },
        now
      );
      if (!key) return null;
    }
    return { profile, key: QR_CODE_KEY };
  }

  if (sent.ask && sent.followUp) return null;

  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, created_at, onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (error.code === MISSING_COLUMN) {
      return force
        ? { profile: placeholder(userId), key: nextKey(sent) }
        : null;
    }
    throw error;
  }
  const row = data as {
    user_id: string;
    created_at: string;
    onboarding_completed_at: string | null;
  } | null;
  if (!row) return null;

  const profile: TestAppointmentProfile = {
    user_id: row.user_id,
    onboarding_status: 'completed',
    created_at: row.created_at,
  };

  if (sent.ask) {
    if (!force) {
      const askSentAt = sent.askSentAt ? new Date(sent.askSentAt) : null;
      const key = decideReceiptReviewEmail(
        {
          askSentAt,
          askSentOn: askSentAt
            ? calendarDateInTimeZone(askSentAt, ONBOARDING_EMAIL_TIMEZONE)
            : null,
          today: calendarDateInTimeZone(now, ONBOARDING_EMAIL_TIMEZONE),
          alreadySent: false,
          hasBooking: false,
        },
        now
      );
      if (!key) return null;
    }
    return { profile, key: RECEIPT_REVIEW_KEY };
  }

  if (force) return { profile, key: TEST_APPOINTMENT_KEY };

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
  return { profile, key: TEST_APPOINTMENT_KEY };
}

function nextKey(sent: {
  ask: boolean;
}): typeof TEST_APPOINTMENT_KEY | typeof RECEIPT_REVIEW_KEY {
  return sent.ask ? RECEIPT_REVIEW_KEY : TEST_APPOINTMENT_KEY;
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

interface AskRow {
  user_id: string;
  sent_at: string;
  followUpSent: boolean;
}

async function loadAskPage(
  admin: Admin,
  now: Date,
  page: number
): Promise<AskRow[]> {
  const windowStart = new Date(now.getTime() - SETUP_LOOKBACK_MS);
  const readyAt = new Date(now.getTime() - RECEIPT_REVIEW_AFTER_ASK_MS);
  const from = page * CANDIDATE_PAGE;
  const { data, error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('user_id, sent_at')
    .eq('email_key', TEST_APPOINTMENT_KEY)
    .gte('sent_at', windowStart.toISOString())
    .lte('sent_at', readyAt.toISOString())
    .order('sent_at', { ascending: true })
    .range(from, from + CANDIDATE_PAGE - 1);
  if (error) throw error;
  const asks = (data ?? []) as { user_id: string; sent_at: string }[];
  if (asks.length === 0) return [];
  const { data: followUps, error: followUpError } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('user_id')
    .in(
      'user_id',
      asks.map(row => row.user_id)
    )
    .eq('email_key', RECEIPT_REVIEW_KEY);
  if (followUpError) throw followUpError;
  const sentFollowUp = new Set(
    ((followUps ?? []) as { user_id: string }[]).map(row => row.user_id)
  );
  return asks.map(row => ({
    ...row,
    followUpSent: sentFollowUp.has(row.user_id),
  }));
}

async function loadSentKeys(
  admin: Admin,
  userId: string
): Promise<{
  ask: boolean;
  askSentAt: string | null;
  followUp: boolean;
  qr: boolean;
}> {
  const { data, error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('email_key, sent_at')
    .eq('user_id', userId)
    .in('email_key', [TEST_APPOINTMENT_KEY, RECEIPT_REVIEW_KEY, QR_CODE_KEY]);
  if (error) throw error;
  const rows = (data ?? []) as { email_key: string; sent_at: string }[];
  const ask = rows.find(row => row.email_key === TEST_APPOINTMENT_KEY);
  return {
    ask: Boolean(ask),
    askSentAt: ask?.sent_at ?? null,
    followUp: rows.some(row => row.email_key === RECEIPT_REVIEW_KEY),
    qr: rows.some(row => row.email_key === QR_CODE_KEY),
  };
}

async function loadSentForKey(
  admin: Admin,
  userIds: string[],
  key: string
): Promise<Set<string>> {
  const sent = new Set<string>();
  if (userIds.length === 0) return sent;
  const { data, error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('user_id')
    .in('user_id', userIds)
    .eq('email_key', key);
  if (error) throw error;
  for (const row of (data ?? []) as { user_id: string }[]) {
    sent.add(row.user_id);
  }
  return sent;
}

async function loadFirstBookingAt(
  admin: Admin,
  businessId: string
): Promise<Date | null> {
  const { data, error } = await tables(admin)
    .from('bookings')
    .select('created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  const createdAt = (data as { created_at?: string }[] | null)?.[0]?.created_at;
  return createdAt ? new Date(createdAt) : null;
}

async function loadCompletedProfile(
  admin: Admin,
  userId: string
): Promise<TestAppointmentProfile | null> {
  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, created_at, onboarding_status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const row = data as {
    user_id: string;
    created_at: string;
    onboarding_status: string;
  } | null;
  if (!row || row.onboarding_status !== 'completed') return null;
  return {
    user_id: row.user_id,
    onboarding_status: 'completed',
    created_at: row.created_at,
  };
}

interface BookingRow {
  business_id: string;
  created_at: string;
}

async function loadBookingPage(
  admin: Admin,
  now: Date,
  page: number
): Promise<BookingRow[]> {
  const windowStart = new Date(now.getTime() - SETUP_LOOKBACK_MS);
  const readyAt = new Date(now.getTime() - QR_CODE_DELAY_MS);
  const from = page * CANDIDATE_PAGE;
  const { data, error } = await tables(admin)
    .from('bookings')
    .select('business_id, created_at')
    .gte('created_at', windowStart.toISOString())
    .lte('created_at', readyAt.toISOString())
    .order('created_at', { ascending: true })
    .range(from, from + CANDIDATE_PAGE - 1);
  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

async function loadOwnersForBusinesses(
  admin: Admin,
  businessIds: string[]
): Promise<Map<string, { userId: string }>> {
  const owners = new Map<string, { userId: string }>();
  if (businessIds.length === 0) return owners;
  const { data, error } = await tables(admin)
    .from('business_profiles')
    .select('id, profile_id')
    .in('id', businessIds);
  if (error) throw error;
  const businesses = (data ?? []) as { id: string; profile_id: string }[];
  if (businesses.length === 0) return owners;
  const { data: profiles, error: profileError } = await tables(admin)
    .from('profiles')
    .select('user_id')
    .in(
      'user_id',
      businesses.map(row => row.profile_id)
    )
    .eq('onboarding_status', 'completed');
  if (profileError) throw profileError;
  const completed = new Set(
    ((profiles ?? []) as { user_id: string }[]).map(row => row.user_id)
  );
  for (const row of businesses) {
    if (completed.has(row.profile_id)) {
      owners.set(row.id, { userId: row.profile_id });
    }
  }
  return owners;
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
