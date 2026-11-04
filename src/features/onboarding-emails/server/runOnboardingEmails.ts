import { ROUTES } from '@/constants/routes';
import { SERVICELINK_SUPPORT_EMAIL } from '@/constants/support';
import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import { calendarDateInTimeZone } from '@/features/availability/booking/server/reminders/ownerBookingReminderDate';
import {
  getAppBaseUrl,
  getFromEmail,
  getResendClient,
} from '@/features/email/services/resendClient';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CANDIDATE_PAGE,
  CANDIDATE_PAGE_LIMIT,
  INTERNAL_EMAIL_DOMAIN,
  ONBOARDING_EMAIL_TIMEZONE,
  SETUP_EMAILS_ENABLED,
  SETUP_EMAIL_SEND_BATCH,
  SETUP_EMAIL_SEND_CONCURRENCY,
  SETUP_LOOKBACK_MS,
  type SetupEmailKey,
} from '../constants';
import { decideSetupEmail, type SetupEmailState } from '../eligibility';
import { buildSetupEmail } from '../templates/setupEmails';

type Admin = SupabaseClient<Database>;

/** The query builder collapses on this hand-written schema. Reads are cast below. */
function tables(admin: Admin): SupabaseClient {
  return admin as unknown as SupabaseClient;
}

interface ProfileRow {
  user_id: string;
  onboarding_status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
}

interface SentMarks {
  first: Date | null;
  final: Date | null;
}

interface DueOwner {
  profile: ProfileRow;
  key: SetupEmailKey;
}

export interface OnboardingEmailActionResult {
  userId: string;
  emailKey: string;
  action: 'would_send' | 'sent' | 'failed' | 'deferred';
  reason?: string;
}

export interface OnboardingEmailRunResult {
  enabled: boolean;
  dryRun: boolean;
  examined: number;
  due: number;
  /** Due owners left for the next morning because this run hit its send cap. */
  remaining: number;
  actions: OnboardingEmailActionResult[];
}

interface RunOptions {
  dryRun?: boolean;
  now?: Date;
  /** Limit this run to one owner. Required for `force`. */
  userId?: string;
  /** Send the next unsent note now. Ignored unless `userId` is set. */
  force?: boolean;
}

const USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MISSING_TABLE = '42P01';

export async function runOnboardingEmails(
  admin: Admin,
  options: RunOptions = {}
): Promise<OnboardingEmailRunResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun === true;
  const userId = options.userId?.trim() ?? '';
  const force = options.force === true && userId.length > 0;
  const empty = (): OnboardingEmailRunResult => ({
    enabled: SETUP_EMAILS_ENABLED,
    dryRun,
    examined: 0,
    due: 0,
    remaining: 0,
    actions: [],
  });

  if (!SETUP_EMAILS_ENABLED) return empty();

  if (userId && !USER_ID.test(userId)) {
    return {
      ...empty(),
      actions: [
        {
          userId,
          emailKey: '',
          action: 'failed',
          reason: 'userId must be a profile id',
        },
      ],
    };
  }

  const today = calendarDateInTimeZone(now, ONBOARDING_EMAIL_TIMEZONE);
  const { examined, due } = userId
    ? await loadOne(admin, userId, now, today, force)
    : await loadDue(admin, now, today);
  const queued = due.slice(0, SETUP_EMAIL_SEND_BATCH);
  const remaining = due.length - queued.length;

  if (queued.length === 0) {
    return { ...empty(), examined, due: due.length, remaining };
  }

  const emails = await lookupEmails(
    admin,
    queued.map(item => item.profile.user_id)
  );

  if (dryRun) {
    return {
      enabled: true,
      dryRun,
      examined,
      due: due.length,
      remaining,
      actions: queued.map(item =>
        preview(item, emails.get(item.profile.user_id))
      ),
    };
  }

  const actions = await mapWithConcurrency(
    queued,
    SETUP_EMAIL_SEND_CONCURRENCY,
    item => sendOne(admin, item, emails.get(item.profile.user_id), now)
  );

  return {
    enabled: true,
    dryRun,
    examined,
    due: due.length,
    remaining,
    actions,
  };
}

async function loadOne(
  admin: Admin,
  userId: string,
  now: Date,
  today: string,
  force: boolean
): Promise<{ examined: number; due: DueOwner[] }> {
  const profile = await loadProfileById(admin, userId);
  if (!profile) return { examined: 0, due: [] };

  const marks = await loadMarks(admin, [profile.user_id]);
  const key = chooseKey(profile, marks.get(profile.user_id), today, now, force);
  return { examined: 1, due: key ? [{ profile, key }] : [] };
}

async function loadProfileById(
  admin: Admin,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, onboarding_status, created_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

function chooseKey(
  profile: ProfileRow,
  sent: SentMarks | undefined,
  today: string,
  now: Date,
  force: boolean
): SetupEmailKey | null {
  if (!force) {
    return decideSetupEmail(
      toState(profile, sent, today, { excluded: false, noEmail: false }),
      now
    );
  }
  if (profile.onboarding_status === 'completed' || sent?.final) return null;
  if (!sent?.first) return 'A1_setup_one_step';
  return 'A2_setup_final';
}

async function loadDue(
  admin: Admin,
  now: Date,
  today: string
): Promise<{ examined: number; due: DueOwner[] }> {
  const due: DueOwner[] = [];
  let examined = 0;

  for (let page = 0; page < CANDIDATE_PAGE_LIMIT; page += 1) {
    const rows = await loadProfilePage(admin, now, page);
    examined += rows.length;
    const marks = await loadMarks(
      admin,
      rows.map(row => row.user_id)
    );

    for (const profile of rows) {
      const key = decideSetupEmail(
        toState(profile, marks.get(profile.user_id), today, {
          excluded: false,
          noEmail: false,
        }),
        now
      );
      if (key) due.push({ profile, key });
    }

    if (rows.length < CANDIDATE_PAGE) break;
    if (due.length >= SETUP_EMAIL_SEND_BATCH) break;
  }

  return { examined, due };
}

async function loadProfilePage(
  admin: Admin,
  now: Date,
  page: number
): Promise<ProfileRow[]> {
  const windowStart = new Date(now.getTime() - SETUP_LOOKBACK_MS);
  const from = page * CANDIDATE_PAGE;
  const { data, error } = await tables(admin)
    .from('profiles')
    .select('user_id, onboarding_status, created_at')
    .gte('created_at', windowStart.toISOString())
    .in('onboarding_status', ['not_started', 'in_progress'])
    .order('created_at', { ascending: true })
    .range(from, from + CANDIDATE_PAGE - 1);

  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

async function loadMarks(
  admin: Admin,
  userIds: string[]
): Promise<Map<string, SentMarks>> {
  const marks = new Map<string, SentMarks>();
  if (userIds.length === 0) return marks;

  const { data, error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .select('user_id, email_key, sent_at')
    .in('user_id', userIds)
    .in('email_key', ['A1_setup_one_step', 'A2_setup_final']);

  if (error) {
    if (error.code === MISSING_TABLE) {
      throw new Error('Run 001_setup_emails.sql before this job can run.');
    }
    throw error;
  }

  for (const row of (data ?? []) as {
    user_id: string;
    email_key: string;
    sent_at: string;
  }[]) {
    const current = marks.get(row.user_id) ?? { first: null, final: null };
    const sentAt = new Date(row.sent_at);
    if (row.email_key === 'A1_setup_one_step') current.first = sentAt;
    if (row.email_key === 'A2_setup_final') current.final = sentAt;
    marks.set(row.user_id, current);
  }

  return marks;
}

function toState(
  profile: ProfileRow,
  sent: SentMarks | undefined,
  today: string,
  flags: { excluded: boolean; noEmail: boolean }
): SetupEmailState {
  const firstSentAt = sent?.first ?? null;
  return {
    onboardingStatus: profile.onboarding_status,
    signupAt: new Date(profile.created_at),
    firstSentAt,
    finalSentAt: sent?.final ?? null,
    firstSentOn: firstSentAt
      ? calendarDateInTimeZone(firstSentAt, ONBOARDING_EMAIL_TIMEZONE)
      : null,
    today,
    excluded: flags.excluded,
    noEmail: flags.noEmail,
  };
}

function preview(
  item: DueOwner,
  lookedUp: EmailLookup | undefined
): OnboardingEmailActionResult {
  const blocked = recipientBlock(lookedUp);
  if (blocked) {
    return {
      userId: item.profile.user_id,
      emailKey: item.key,
      action: 'deferred',
      reason: blocked,
    };
  }
  return {
    userId: item.profile.user_id,
    emailKey: item.key,
    action: 'would_send',
  };
}

function recipientBlock(
  lookedUp: EmailLookup | undefined
): 'email_lookup_failed' | 'not_eligible' | null {
  if (!lookedUp || lookedUp.kind === 'retry') return 'email_lookup_failed';
  const email = lookedUp.kind === 'found' ? lookedUp.email : '';
  if (!email || email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`))
    return 'not_eligible';
  return null;
}

async function sendOne(
  admin: Admin,
  item: DueOwner,
  lookedUp: EmailLookup | undefined,
  now: Date
): Promise<OnboardingEmailActionResult> {
  const blocked = recipientBlock(lookedUp);
  if (blocked) {
    return {
      userId: item.profile.user_id,
      emailKey: item.key,
      action: 'deferred',
      reason: blocked,
    };
  }

  const email = (lookedUp as { kind: 'found'; email: string }).email;
  let claimed = false;
  try {
    claimed = await claim(admin, item.profile.user_id, item.key);
    if (!claimed) {
      return {
        userId: item.profile.user_id,
        emailKey: item.key,
        action: 'deferred',
        reason: 'already_sent',
      };
    }

    const client = getResendClient();
    if (!client) {
      await release(admin, item.profile.user_id, item.key);
      claimed = false;
      return {
        userId: item.profile.user_id,
        emailKey: item.key,
        action: 'failed',
        reason: 'RESEND_API_KEY is not set',
      };
    }

    const message = buildSetupEmail(item.key, {
      dashboardUrl: dashboardLink(item.key),
      privacyUrl: `${getAppBaseUrl()}${ROUTES.PRIVACY}`,
      year: now.getUTCFullYear(),
    });

    const { data, error } = await client.emails.send(
      {
        from: getFromEmail(),
        to: [email],
        replyTo: SERVICELINK_SUPPORT_EMAIL,
        subject: message.subject,
        html: message.html,
        text: message.text,
        tags: [
          { name: 'category', value: 'onboarding' },
          { name: 'email_key', value: item.key },
        ],
      },
      { idempotencyKey: `onboarding:${item.profile.user_id}:${item.key}` }
    );

    if (error || !data?.id) {
      await release(admin, item.profile.user_id, item.key);
      claimed = false;
      return {
        userId: item.profile.user_id,
        emailKey: item.key,
        action: 'failed',
        reason: error?.message || 'Resend did not return an id',
      };
    }

    return {
      userId: item.profile.user_id,
      emailKey: item.key,
      action: 'sent',
    };
  } catch (error) {
    if (claimed) {
      await release(admin, item.profile.user_id, item.key).catch(
        () => undefined
      );
    }
    return {
      userId: item.profile.user_id,
      emailKey: item.key,
      action: 'failed',
      reason: error instanceof Error ? error.message : 'send_failed',
    };
  }
}

async function claim(
  admin: Admin,
  userId: string,
  key: SetupEmailKey
): Promise<boolean> {
  const { error } = await tables(admin).from('owner_lifecycle_emails').insert({
    user_id: userId,
    email_key: key,
    sent_at: new Date().toISOString(),
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

async function release(
  admin: Admin,
  userId: string,
  key: SetupEmailKey
): Promise<void> {
  const { error } = await tables(admin)
    .from('owner_lifecycle_emails')
    .delete()
    .eq('user_id', userId)
    .eq('email_key', key);
  if (error) throw error;
}

type EmailLookup =
  | { kind: 'found'; email: string }
  | { kind: 'missing' }
  | { kind: 'retry' };

async function lookupEmails(
  admin: Admin,
  userIds: string[]
): Promise<Map<string, EmailLookup>> {
  const found = new Map<string, EmailLookup>();
  await mapWithConcurrency(
    userIds,
    SETUP_EMAIL_SEND_CONCURRENCY,
    async userId => {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error) {
        found.set(
          userId,
          error.status === 404 ? { kind: 'missing' } : { kind: 'retry' }
        );
        return;
      }
      const email = data.user?.email?.trim().toLowerCase() ?? '';
      found.set(userId, email ? { kind: 'found', email } : { kind: 'missing' });
    }
  );
  return found;
}

function dashboardLink(key: SetupEmailKey): string {
  const url = new URL(ROUTES.DASHBOARD.MAIN, getAppBaseUrl());
  url.searchParams.set('utm_source', 'onboarding_email');
  url.searchParams.set('utm_campaign', key);
  return url.toString();
}
