/**
 * POST /api/webhooks/supabase/bookings
 *
 * Supabase **Database Webhook** target for `public.bookings` **INSERT** events.
 * Sends the same V2 availability booking emails as the web app (owner + optional
 * customer) and inserts the owner in-app notification — so mobile / direct DB
 * inserts get confirmations without running Next.js booking API code.
 *
 * ---
 * **Supabase Dashboard setup** (run after deploy + env vars)
 *
 * 1. **SQL — required columns** (run in Supabase SQL Editor if not already present):
 *
 *    ```sql
 *    alter table public.bookings
 *      add column if not exists suppress_customer_booking_confirmation boolean not null default false;
 *    ```
 *
 *    Quote-approved bookings set this to `true` so we do not send the customer
 *    “appointment confirmed” email (matches pre-webhook behavior).
 *
 * 2. **SQL — idempotency (recommended; avoids duplicate Resend sends on retries)**:
 *
 *    ```sql
 *    create table if not exists public.booking_confirmation_dispatch (
 *      booking_id uuid primary key references public.bookings(id) on delete cascade,
 *      created_at timestamptz not null default now()
 *    );
 *    ```
 *
 * 3. **Database → Webhooks** (or Integrations → Database Webhooks): Create hook
 *    - **Table:** `bookings`
 *    - **Events:** Insert only (recommended for “new appointment”)
 *    - **HTTP Request URL:** `https://<your-vercel-domain>/api/webhooks/supabase/bookings`
 *    - **HTTP method:** POST
 *    - **Headers:** add `Authorization: Bearer <same secret as SUPABASE_BOOKINGS_WEBHOOK_SECRET>`
 *      (or configure HMAC `x-supabase-signature` per your Supabase version; this route
 *      accepts Bearer **or** `x-supabase-signature` HMAC-SHA256 of the raw JSON body.)
 *
 * 4. **Vercel env**
 *    - `BOOKING_EMAIL_WEBHOOK_ENABLED` = `true` when the hook is live and you have removed
 *      duplicate sends from API routes (see `bookingEmailWebhookFlags.ts`).
 *    - `SUPABASE_BOOKINGS_WEBHOOK_SECRET` — strong random string; must match the Bearer token
 *      (or HMAC secret) configured in Supabase.
 *
 * **Rollout:** Deploy with `BOOKING_EMAIL_WEBHOOK_ENABLED` unset/false first (webhook may
 * POST but handler returns 200 without sending). Configure Supabase hook + SQL, then set
 * flag to `true` so only this path sends new-booking emails.
 */

import { isBookingEmailWebhookDispatchEnabled } from '@/features/availability/server/bookingEmailWebhookFlags';
import {
  buildAvailabilityBookingNotificationPayloadFromRecord,
  parseBookingsWebhookRecord,
  type BookingsWebhookRecord,
} from '@/features/availability/server/buildAvailabilityBookingNotificationPayloadFromRecord';
import { dispatchNewAvailabilityBookingNotifications } from '@/features/availability/server/dispatchNewAvailabilityBookingNotifications';
import { tryClaimBookingConfirmationDispatch } from '@/features/availability/server/tryClaimBookingConfirmationDispatch';
import { verifySupabaseBookingsWebhookRequest } from '@/features/availability/server/verifySupabaseBookingsWebhookRequest';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

type SupabaseDbWebhookBody = {
  type?: string;
  table?: string;
  schema?: string;
  record?: unknown;
  old_record?: unknown;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isBookingEmailWebhookDispatchEnabled()) {
    return NextResponse.json(
      { ok: true, skipped: 'BOOKING_EMAIL_WEBHOOK_ENABLED is not true' },
      { status: 200 }
    );
  }

  const secret = process.env.SUPABASE_BOOKINGS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error(
      '[webhooks/supabase/bookings] SUPABASE_BOOKINGS_WEBHOOK_SECRET is not set'
    );
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  if (!verifySupabaseBookingsWebhookRequest(rawBody, request.headers, secret)) {
    console.warn('[webhooks/supabase/bookings] invalid webhook authentication');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SupabaseDbWebhookBody;
  try {
    body = JSON.parse(rawBody) as SupabaseDbWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type !== 'INSERT') {
    return NextResponse.json({ ok: true, ignored: 'not an INSERT' }, { status: 200 });
  }
  if (body.schema !== 'public' || body.table !== 'bookings') {
    return NextResponse.json(
      { ok: true, ignored: 'wrong table or schema' },
      { status: 200 }
    );
  }

  const parsedRecord = parseBookingsWebhookRecord(body.record);
  if (!parsedRecord) {
    console.warn('[webhooks/supabase/bookings] malformed record');
    return NextResponse.json({ error: 'Malformed record' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const claim = await tryClaimBookingConfirmationDispatch(
    supabase,
    parsedRecord.id
  );
  if (claim === 'duplicate') {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
  }

  const claimedForRetry =
    claim === 'claimed' ? (parsedRecord.id as string) : null;

  try {
    await processBookingInsert(supabase, parsedRecord);
  } catch (e) {
    if (claimedForRetry) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('booking_confirmation_dispatch')
          .delete()
          .eq('booking_id', claimedForRetry);
      } catch {
        // best-effort: allow a future retry to re-claim
      }
    }
    console.error('[webhooks/supabase/bookings] handler error', {
      bookingId: parsedRecord.id,
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processBookingInsert(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  parsedRecord: BookingsWebhookRecord
): Promise<void> {
  const built = await buildAvailabilityBookingNotificationPayloadFromRecord(
    supabase,
    parsedRecord
  );
  if (!built) {
    throw new Error('Could not build email payload');
  }

  const sendCustomer = parsedRecord.suppress_customer_booking_confirmation !== true;

  await dispatchNewAvailabilityBookingNotifications(supabase, {
    profileId: built.profileId,
    bookingId: parsedRecord.id,
    customerName: parsedRecord.customer_name,
    serviceSummaryLine: built.serviceSummaryLine,
    scheduledDate: parsedRecord.scheduled_date,
    emailPayload: built.emailPayload,
    sendCustomerConfirmation: sendCustomer,
    businessDisplayName: built.businessDisplayName,
  });
}
