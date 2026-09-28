/**
 * Backfill signup_attribution for billed active Pros.
 *
 * Dry-run (default — prints counts, writes nothing):
 *   npx tsx --env-file=.env.local scripts/backfill-signup-attribution-first-paid.ts
 *
 * Apply (inserts unknown rows and sets first_paid_at from Stripe).
 * Does not send Pro welcome emails or Meta Subscribe.
 *   npx tsx --env-file=.env.local scripts/backfill-signup-attribution-first-paid.ts --apply
 */

import { runSignupAttributionFirstPaidBackfill } from '../src/features/marketing-attribution/server/backfillSignupAttributionFirstPaid';
import { createSupabaseAdminClient } from '../src/libs/supabase/admin';
import { getStripePlatform } from '../src/libs/stripe/platformClient';

async function main() {
  const apply = process.argv.includes('--apply');
  const admin = createSupabaseAdminClient();
  const report = await runSignupAttributionFirstPaidBackfill({
    admin,
    stripe: apply ? getStripePlatform() : null,
    dryRun: !apply,
  });

  console.log(apply ? 'Applied:' : 'Dry run (nothing written):');
  console.log(report);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
