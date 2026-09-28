/**
 * Keep Pro attribution stamp + welcome email alive after the Stripe webhook
 * returns 200. Same `after()` pattern as the payment-failed email.
 */

import { sendProWelcomeIfFirstPaidPro } from '@/features/pricing/server/sendProWelcomeIfFirstPaidPro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { after } from 'next/server';
import { markSignupAttributionFirstPaid } from './markSignupAttributionFirstPaid';

export function scheduleProFirstPaidSideEffects(
  supabase: SupabaseClient,
  eventId: string,
  params: { userId?: string; stripeSubscriptionId?: string }
): void {
  after(async () => {
    try {
      const stamp = await markSignupAttributionFirstPaid(supabase, params);
      if (stamp.stamped) {
        console.info('[stripe:webhook] signup attribution first paid stamped', {
          eventId,
        });
      } else if (stamp.error) {
        console.error('[stripe:webhook] signup attribution first paid failed', {
          eventId,
          reason: stamp.error,
        });
      } else {
        console.info('[stripe:webhook] signup attribution first paid skipped', {
          eventId,
          reason: stamp.skippedReason ?? 'unknown',
        });
      }
    } catch (err) {
      console.error('[stripe:webhook] signup attribution first paid', err);
    }

    try {
      const welcome = await sendProWelcomeIfFirstPaidPro(supabase, params);
      if (welcome.sent) {
        console.info('[stripe:webhook] pro welcome email sent', { eventId });
      } else if (welcome.error) {
        console.error('[stripe:webhook] pro welcome email failed', {
          eventId,
          reason: welcome.error,
        });
      } else {
        console.info('[stripe:webhook] pro welcome email skipped', {
          eventId,
          reason: welcome.skippedReason ?? 'unknown',
        });
      }
    } catch (err) {
      console.error('[stripe:webhook] pro welcome email', err);
    }
  });
}
