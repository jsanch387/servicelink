import { getPublicBusinessProfilePath, ROUTES } from '@/constants/routes';
import { OWNER_TEST_PRACTICE_PARAM } from '@/features/onboarding-v3/ownerTestGuide';
import { SERVICELINK_SUPPORT_EMAIL } from '@/constants/support';
import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import { calendarDateInTimeZone } from '@/features/availability/booking/server/reminders/ownerBookingReminderDate';
import { loadAppStoreBadgeAttachment } from '@/features/email/appStoreBadgeAttachment';
import {
  getAppBaseUrl,
  getResendClient,
  MARK_FROM_EMAIL,
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
  QR_CODE_KEY,
  RECEIPT_REVIEW_KEY,
  SETUP_LOOKBACK_MS,
  TEST_APPOINTMENT_KEY,
  type SetupEmailKey,
} from '../constants';
import { decideSetupEmail, type SetupEmailState } from '../eligibility';
import {
  buildQrCodeEmail,
  buildReceiptReviewEmail,
  buildSetupEmail,
  buildTestAppointmentEmail,
} from '../templates/setupEmails';
import {
  loadQrCodeDue,
  loadReceiptReviewDue,
  loadTestAppointmentDue,
  loadTestAppointmentForUser,
} from './loadTestAppointments';

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
  const primary = userId
    ? await loadOne(admin, userId, now, today, force)
    : await loadDue(admin, now, today);
  const test = userId
    ? { examined: 0, due: [] }
    : await loadTestAppointmentDue(admin, now);
  const followUp = userId
    ? { examined: 0, due: [] }
    : await loadReceiptReviewDue(admin, now);
  const qr = userId
    ? { examined: 0, due: [] }
    : await loadQrCodeDue(admin, now);
  const due = [
    ...primary.due,
    ...test.due.map(profile => ({
      profile,
      key: TEST_APPOINTMENT_KEY,
    })),
    ...followUp.due.map(profile => ({
      profile,
      key: RECEIPT_REVIEW_KEY,
    })),
    ...qr.due.map(profile => ({
      profile,
      key: QR_CODE_KEY,
    })),
  ];
  const examined =
    primary.examined + test.examined + followUp.examined + qr.examined;
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

  if (profile.onboarding_status === 'completed') {
    const match = await loadTestAppointmentForUser(
      admin,
      profile.user_id,
      now,
      force
    );
    return {
      examined: 1,
      due: match ? [{ profile: match.profile, key: match.key }] : [],
    };
  }

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

    const content = {
      dashboardUrl: await actionLink(admin, item.profile.user_id, item.key),
      privacyUrl: `${getAppBaseUrl()}${ROUTES.PRIVACY}`,
      year: now.getUTCFullYear(),
    };
    const message =
      item.key === QR_CODE_KEY
        ? buildQrCodeEmail(content)
        : item.key === RECEIPT_REVIEW_KEY
          ? buildReceiptReviewEmail(content)
          : item.key === TEST_APPOINTMENT_KEY
            ? buildTestAppointmentEmail(content)
            : buildSetupEmail(item.key, content);

    const { data, error } = await client.emails.send(
      {
        from: MARK_FROM_EMAIL,
        to: [email],
        replyTo: SERVICELINK_SUPPORT_EMAIL,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: [loadAppStoreBadgeAttachment()],
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

async function actionLink(
  admin: Admin,
  userId: string,
  key: SetupEmailKey
): Promise<string> {
  const booking =
    key === TEST_APPOINTMENT_KEY || key === RECEIPT_REVIEW_KEY
      ? await publicBookingLink(admin, userId)
      : null;
  const url = booking
    ? new URL(booking)
    : new URL(ROUTES.DASHBOARD.MAIN, getAppBaseUrl());
  if (booking) url.searchParams.set(OWNER_TEST_PRACTICE_PARAM, '1');
  url.searchParams.set('utm_source', 'onboarding_email');
  url.searchParams.set('utm_campaign', key);
  return url.toString();
}

/** The public page customers book from. No login. */
async function publicBookingLink(
  admin: Admin,
  userId: string
): Promise<string | null> {
  const { data, error } = await tables(admin)
    .from('business_profiles')
    .select('business_slug, created_at')
    .eq('profile_id', userId);
  if (error) throw error;
  const slug = (
    (data ?? []) as { business_slug: string | null; created_at: string }[]
  )
    .filter(row => row.business_slug?.trim())
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
    ?.business_slug?.trim();
  if (!slug) return null;
  return new URL(
    getPublicBusinessProfilePath(slug),
    getAppBaseUrl()
  ).toString();
}
