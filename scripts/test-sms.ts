/**
 * Dev script: send a single test SMS via Pingram to verify the integration.
 *
 * Usage:
 *   npm run script:test-sms -- --to +15551234567
 *   npm run script:test-sms -- --to 5551234567 --business "Joe's Detailing"
 *   npm run script:test-sms -- --to +15551234567 --message "Custom message"
 *
 * Requires in .env.local:
 *   PINGRAM_API_KEY        (pingram_sk_...)
 *   PINGRAM_REGION         (optional: us | eu | ca)
 *   PINGRAM_FROM_NUMBER    (optional; leave unset to use Pingram shared sender)
 *
 * Note: with no dedicated number purchased, Pingram sends from a shared sender,
 * which is fine for testing.
 */

import { buildBookingConfirmedSms } from '../src/features/sms/messages/bookingSms';
import { sendSms } from '../src/features/sms/services/sendSms';

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim() || undefined;
}

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const to = readArg('--to');
  const business = readArg('--business') || 'Test Business';
  const customMessage = readArg('--message');

  if (!to) {
    console.error(`
Usage:
  npm run script:test-sms -- --to +15551234567
  npm run script:test-sms -- --to 5551234567 --business "Joe's Detailing"
  npm run script:test-sms -- --to +15551234567 --message "Custom message"
`);
    process.exit(1);
  }

  if (!process.env.PINGRAM_API_KEY) {
    console.error('PINGRAM_API_KEY is not set in .env.local.');
    process.exit(1);
  }

  const message =
    customMessage ||
    buildBookingConfirmedSms({
      businessName: business,
      scheduledDate: todayPlusDays(1),
      startTime: '14:30',
    });

  console.log('Sending test SMS...');
  console.log('  to:     ', to);
  console.log('  message:', message);

  const result = await sendSms({ to, type: 'test_sms', message });

  if (result.sent) {
    console.log('\nHanded off to Pingram successfully (result: sent).');
    console.log(
      'If the text does not arrive, check the Pingram dashboard logs and that a sender is available.'
    );
  } else {
    console.error(`\nNot sent. Reason: ${result.reason}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
