/**
 * Run the daily reminder job locally (uses .env.local).
 *
 * Dry-run (default — no push, email, or SMS):
 *   npx tsx --env-file=.env.local scripts/run-booking-reminders.ts
 *
 * Send owner push to one account:
 *   npx tsx --env-file=.env.local scripts/run-booking-reminders.ts --send --only-email you@example.com
 *
 * Send customer email/SMS for bookings matching that customer email:
 *   npx tsx --env-file=.env.local scripts/run-booking-reminders.ts --send --only-customer-email them@example.com
 */

import { findAuthUserIdByEmail } from '../src/features/account/server/updateAccountEmailAdmin';
import { runBookingReminders } from '../src/features/availability/booking/server/reminders';
import { createSupabaseAdminClient } from '../src/libs/supabase/admin';

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

async function main() {
  const send = process.argv.includes('--send');
  const onlyEmail = readArg('--only-email');
  const onlyCustomerEmail = readArg('--only-customer-email');

  if (send && !onlyEmail && !onlyCustomerEmail) {
    console.error(
      'Refusing to notify everyone. Pass --only-email and/or --only-customer-email'
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
  const result = await runBookingReminders(admin, {
    dryRun: !send,
    skipOwner: send && !onlyEmail,
    skipCustomer: send && !onlyCustomerEmail,
    onlyProfileId,
    onlyCustomerEmail: onlyCustomerEmail ?? null,
    correlationId: 'local-script',
  });

  console.log(send ? 'Sent (filtered):' : 'Dry run (nothing sent):');
  console.log(result);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
