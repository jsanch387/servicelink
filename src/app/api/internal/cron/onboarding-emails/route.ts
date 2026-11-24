/**
 * GET /api/internal/cron/onboarding-emails
 *
 * Thin route. Auth lives in `src/features/cron`.
 * The come-back-and-finish emails live in `src/features/onboarding-emails`.
 */

import { handleCronGet } from '@/features/cron';
import { runOnboardingEmails } from '@/features/onboarding-emails/server/runOnboardingEmails';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = handleCronGet(async ({ request }) => {
  const admin = createSupabaseAdminClient();
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const userId = request.nextUrl.searchParams.get('userId')?.trim() || '';
  const force = request.nextUrl.searchParams.get('force') === '1';
  return runOnboardingEmails(admin, {
    dryRun,
    userId: userId || undefined,
    force: Boolean(userId) && force,
  });
});
