/**
 * Run the owner appointment-reminder job locally (uses .env.local).
 *
 * Dry-run (default — no push, no inbox row):
 *   npx tsx --env-file=.env.local scripts/run-booking-reminders.ts
 *
 * Send to one owner only:
 *   npx tsx --env-file=.env.local scripts/run-booking-reminders.ts --send --only-email you@example.com
 */

import { findAuthUserIdByEmail } from '../src/features/account/server/updateAccountEmailAdmin';
import { runOwnerBookingReminders } from '../src/features/availability/booking/server/runOwnerBookingReminders';
import { createSupabaseAdminClient } from '../src/libs/supabase/admin';

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

async function main() {
  const send = process.argv.includes('--send');
  const onlyEmail = readArg('--only-email');

  if (send && !onlyEmail) {
    console.error(
      'Refusing to send to every owner. Pass --only-email you@example.com'
    );
    process.exit(1);
  }

  let onlyProfileId: string | null = null;
  if (onlyEmail) {
    onlyProfileId = await findAuthUserIdByEmail(onlyEmail);
    if (!onlyProfileId) {
      console.error(`No auth user for ${onlyEmail}`);
      process.exit(1);
    }
  }

  const admin = createSupabaseAdminClient();
  const result = await runOwnerBookingReminders(admin, {
    dryRun: !send,
    onlyProfileId,
    correlationId: 'local-script',
  });

  console.log(send ? 'Sent (one owner):' : 'Dry run (nothing sent):');
  console.log(result);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
