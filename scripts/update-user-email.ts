/**
 * Admin script: set a user's auth email immediately (bypasses confirmation emails).
 *
 * Usage:
 *   npm run script:update-user-email -- --user-id <uuid> --email new@example.com
 *   npm run script:update-user-email -- --from old@typo.com --email new@example.com
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */

import {
  findAuthUserIdByEmail,
  updateAccountEmailAdmin,
} from '../src/features/account/server/updateAccountEmailAdmin';

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

async function main() {
  const userIdArg = readArg('--user-id');
  const fromEmail = readArg('--from');
  const newEmail = readArg('--email');
  const dryRun = process.argv.includes('--dry-run');

  if (!newEmail) {
    console.error(`
Usage:
  npm run script:update-user-email -- --user-id <uuid> --email new@example.com
  npm run script:update-user-email -- --from old@typo.com --email new@example.com

Options:
  --dry-run   Print what would happen without updating Supabase
`);
    process.exit(1);
  }

  let userId = userIdArg;
  if (!userId && fromEmail) {
    console.log(`Looking up user by email: ${fromEmail}`);
    userId = (await findAuthUserIdByEmail(fromEmail)) ?? undefined;
    if (!userId) {
      console.error(`No auth user found with email "${fromEmail}".`);
      process.exit(1);
    }
    console.log(`Found user id: ${userId}`);
  }

  if (!userId) {
    console.error('Provide --user-id <uuid> or --from <current-email>.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('[dry-run] Would update auth user', userId, '→', newEmail);
    process.exit(0);
  }

  const result = await updateAccountEmailAdmin({ userId, newEmail });

  if (!result.ok) {
    console.error('Failed:', result.error);
    process.exit(1);
  }

  console.log('Success.');
  console.log('  user id:      ', result.userId);
  console.log('  previous email:', result.previousEmail ?? '(none)');
  console.log('  new email:    ', result.email);
  console.log('');
  console.log(
    'User can sign in with the new email and their existing password.'
  );
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
