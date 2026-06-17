# Contract: Mobile — SMS notifications, message history & booking actions

This doc covers, for the native app:

1. **How customer phone numbers are stored** and normalized.
2. **The SMS data model** (`sms_messages`) — how every text is logged and how the app reads "messages sent" history.
3. **Job tracking** (`bookings.job_status`) — the stateful fulfillment lifecycle of a booking.
4. **The booking actions endpoint** — one generic, data-driven endpoint that drives a job-status transition **and** sends the matching customer SMS (`on_the_way`, `job_started`, `job_completed`, …).

> **Golden rule:** the app never calls Pingram or sends SMS directly. The server holds the API key, normalizes numbers, enforces ownership, rate-limits (SMS costs money), logs every send, owns the message templates, and owns the state machine. The app triggers **actions** and **reads state**.

---

## 1. How phone numbers are saved

- A booking stores the customer's number in **`bookings.customer_phone`** (free-form text, exactly as entered). It may be empty.
- The app does **not** need to format numbers. The server normalizes to **E.164** at send time (`toE164`): 10-digit US numbers get `+1`, already-`+`-prefixed numbers are kept, ambiguous/invalid values are rejected.
- The **number actually used** for a send is snapshotted on the SMS log row (`sms_messages.to_phone`), so history is accurate even if the customer's number is later edited.
- If a booking has no usable phone, the action still runs (the **state still changes**) but no SMS is sent — the response reports `sms.sent = false` (see §4).

Owner-created bookings and customer self-serve bookings both flow through `POST /api/public/bookings`; if a phone is present, the **booking confirmation SMS** is sent + logged automatically there (and in the Stripe webhook for card-paid bookings). The app does not trigger confirmations.

---

## 2. SMS data model — `sms_messages`

Every outbound SMS attempt is a row in **`public.sms_messages`**. This is the source of truth for the "messages sent" screen.

| Column                   | Type          | Notes                                                                                                                     |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | uuid          | —                                                                                                                         |
| `business_id`            | uuid          | tenancy / RLS scope                                                                                                       |
| `booking_id`             | uuid \| null  | links the message to an appointment                                                                                       |
| `customer_id`            | uuid \| null  | links to the customer                                                                                                     |
| `type`                   | text          | `booking_confirmation` \| `on_the_way` \| `job_started` \| `job_completed` \| `reminder` \| `invoice` … (grows over time) |
| `channel`                | text          | `sms` (room for future channels)                                                                                          |
| `direction`              | text          | `outbound`                                                                                                                |
| `to_phone`               | text          | E.164 number actually used                                                                                                |
| `body`                   | text          | exact message sent (display this in history)                                                                              |
| `status`                 | text          | `queued` \| `sent` \| `delivered` \| `failed` \| `undelivered` \| `skipped_opt_out`                                       |
| `provider`               | text          | `pingram`                                                                                                                 |
| `provider_message_id`    | text \| null  | provider id (for delivery webhooks; may be null for now)                                                                  |
| `error`                  | text \| null  | failure reason                                                                                                            |
| `dedupe_key`             | text \| null  | server idempotency key; ignore on the client                                                                              |
| `metadata`               | jsonb \| null | extensible (e.g. invoice link)                                                                                            |
| `created_at` / `sent_at` | timestamptz   | —                                                                                                                         |

**Status meaning:** `sent` = accepted by the provider; `delivered`/`failed`/`undelivered` come later from delivery webhooks (not wired yet — for now expect `sent` or `failed`).

**RLS:** the owner can **read** rows for their own business (`business_profiles.profile_id = auth.uid()`). The app may `SELECT` directly from Supabase. The app may **not** insert/update — all writes are server-side.

### Reading the "messages sent" history

```sql
-- All messages for a business (newest first)
select id, type, body, status, to_phone, sent_at, created_at, booking_id
from sms_messages
where business_id = '<businessId>'
order by created_at desc;

-- Messages for one booking (per-appointment timeline)
select id, type, body, status, sent_at
from sms_messages
where booking_id = '<bookingId>'
order by created_at desc;
```

Render e.g. "On my way — sent 2:01 PM", "Job completed — sent 4:18 PM".

---

## 3. Job tracking — `bookings.job_status`

A booking is **stateful**: it tracks the on-site fulfillment lifecycle, independent of `bookings.status` (which stays `confirmed | completed | cancelled` and drives slot blocking).

**`bookings.job_status`** (`text`, not null, default `'not_started'`):

```
not_started  ->  on_the_way  ->  in_progress  ->  completed
```

- This is the **live state** the app should display per booking (status chip / timeline) **and** the state that drives the action buttons.
- Always include `job_status` in your booking `SELECT`s.
- The app transitions this state **only** through the actions endpoint (§4); it never writes `job_status` directly.

### Which button to show (derived from `job_status`)

| Current `job_status` | Offer action                            | Button label     |
| -------------------- | --------------------------------------- | ---------------- |
| `not_started`        | `on_the_way` (or skip to `job_started`) | "On my way"      |
| `on_the_way`         | `job_started`                           | "Start job"      |
| `in_progress`        | `job_completed`                         | "Complete job"   |
| `completed`          | —                                       | done (no action) |

The server is the source of truth for what's allowed — see the transition matrix in §4. The table above is just the happy path; the server also lets you skip ahead (e.g. `job_started` directly from `not_started`).

---

## 4. Booking actions endpoint

One generic endpoint runs all owner-triggered booking actions. Each action moves `job_status` and (best-effort) texts the customer.

|                     |                                                                |
| ------------------- | -------------------------------------------------------------- |
| **Method**          | `POST`                                                         |
| **Path**            | `/api/availability/bookings/{bookingId}/actions`               |
| **Example (local)** | `http://localhost:3000/api/availability/bookings/<id>/actions` |

`{bookingId}` is the `bookings.id` UUID. Use your production API origin in release builds.

> ⚠️ The old `POST /api/availability/bookings/{id}/on-my-way` route has been **removed**. Use `…/actions` with `{ "action": "on_the_way" }`.

### Available actions (the registry)

| `action`        | Moves `job_status` to | Allowed from                               | Customer SMS                                                                   |
| --------------- | --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `on_the_way`    | `on_the_way`          | `not_started`                              | "{Business} is on the way for your appointment."                               |
| `job_started`   | `in_progress`         | `not_started`, `on_the_way`                | "{Business} has started your service."                                         |
| `job_completed` | `completed`           | `not_started`, `on_the_way`, `in_progress` | review request (see below) — **one** message, not the generic "completed" text |

All messages append `Reply STOP to opt out.` New actions (e.g. reminders, invoices) are added server-side to the registry; the endpoint shape stays identical.

> **`job_completed` does more than move `job_status`.** It also completes the **booking lifecycle** — sets `bookings.status = 'completed'` and runs the same post-completion side effects as the web "Complete" button (maintenance enrollment advance + the customer completion notification). The response includes `bookingStatus: "completed"` for this action.
>
> **One completion notification — no double-texting.** On `job_completed` the server sends exactly **one** customer message:
>
> - **Customer hasn't reviewed yet** → a **review request** delivered **SMS-first** (a "thank you + please leave us a review" text containing the review link). If there's **no phone or the SMS fails**, it falls back to the **review-invite email**. SMS and email are never both sent.
> - **Customer already reviewed** (or isn't review-eligible) → a plain "{Business} has completed your appointment. Thank you!" SMS courtesy (if they have a phone).
>
> The `job_completed` response carries a `review` object describing this outcome (see below).

### Authentication (required)

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |

Same JWT the app already uses. The server resolves the user (`getAuthenticatedUser`), looks up the owner's business (`business_profiles.profile_id = auth.uid()`), and loads the booking under RLS + an explicit `business_id` check — an owner can only act on their own bookings. Mismatch → `404`.

### Request body

```json
{ "action": "on_the_way" }
```

`action` must be one of the registry keys above. The action is otherwise fully determined by the auth token and `bookingId`.

### Semantics — state first, SMS second

1. The `job_status` **transition is the authoritative outcome** and is applied race-safely. A repeated/concurrent call that finds the booking already in the target (or an otherwise invalid) state returns `409` and sends **no** SMS — this is the idempotency guarantee.
2. The customer SMS is a **best-effort notification sent after** the transition and logged to `sms_messages`. A failed or skipped send (e.g. no phone, provider error) does **not** roll back the state — the job genuinely started/completed. The outcome is reported under `sms`.
3. For `job_completed` only: after the `job_status` move, the server also completes the booking lifecycle (`bookings.status = 'completed'`), fires the maintenance side effect, and sends the **single** completion notification (review-link SMS first → email fallback, or a plain thank-you SMS when already reviewed). All best-effort — they never fail the action. The response adds `bookingStatus: "completed"` and a `review` object. Mobile must **not** separately call the `/review-invite` endpoint or send its own completion text for this booking.

### Success response

**HTTP `200 OK`**

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "sms": { "sent": true, "messageId": "<sms_messages.id>" }
}
```

If the text couldn't be sent (state still changed):

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "sms": { "sent": false, "reason": "no_phone" }
}
```

`sms.reason` ∈ `no_phone | invalid_number | duplicate | not_configured | error`.

For `job_completed`, the response additionally carries `bookingStatus` (the booking is now finalized) and a `review` object describing the single completion notification:

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "sms": { "sent": true, "messageId": "<sms_messages.id>" },
  "review": {
    "requested": true,
    "sent": true,
    "channel": "sms",
    "inviteId": "<review_invites.id>"
  }
}
```

`review` shapes:

| `review`                                                      | Meaning                                                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `{ requested: true, sent: true, channel: "sms", inviteId }`   | Review link **texted** to the customer (the `sms` field is that send).                                                     |
| `{ requested: true, sent: true, channel: "email", inviteId }` | No phone → review invite **emailed**. `sms.sent` is `false` (`no_phone`) because no text was attempted — **not an error**. |
| `{ requested: true, sent: false, channel: "none", inviteId }` | Invite created but delivery failed (best-effort).                                                                          |
| `{ requested: false, reason: "customer_already_reviewed" }`   | No review asked; `sms` is the plain "completed, thank you" courtesy text.                                                  |

`review.reason` ∈ `customer_already_reviewed | pending_invite_exists | invite_already_exists | no_contact_method | no_customer_id | error`.

**App handling:** treat `200` as "the action succeeded — update the chip to `jobStatus`." For `job_completed`, the customer was notified when **either** `sms.sent === true` **or** `review.sent === true` (email fallback). Only show a non-blocking "couldn't reach the customer" note when both are false. For non-completing actions, show that note when `sms.sent === false`. Durable history is always in `sms_messages` (§2). When `bookingStatus` is present, move the booking into your completed/past bucket.

### Error responses

```json
{ "success": false, "error": "<English message>" }
```

| HTTP  | Cause                                                                                                                                                    | App handling                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `400` | Missing `bookingId`, or unknown/missing `action` (`validActions` array included).                                                                        | Client bug; check payload.                                                     |
| `401` | Missing/invalid token.                                                                                                                                   | Prompt re-auth.                                                                |
| `404` | Booking not found / not owned (or no business profile).                                                                                                  | "Appointment not found."                                                       |
| `409` | Booking not `confirmed`, **or** the transition isn't valid from the current `job_status` (already in that state / wrong order / lost a concurrent race). | Refetch `job_status` and re-render buttons; no error toast for "already done". |
| `429` | Rate limited (includes `Retry-After` seconds header).                                                                                                    | Disable + retry after; debounce.                                               |
| `500` | Unexpected error.                                                                                                                                        | Allow manual retry.                                                            |

> Note: a failed **SMS send** is **not** an error here — it returns `200` with `sms.sent = false`. Only state/validation problems return non-2xx.

### Rate limits

| Scope         | Limit         |
| ------------- | ------------- |
| Per owner     | **30 / hour** |
| Per client IP | **60 / hour** |

Honor `Retry-After` on `429`. Debounce the button (one tap = one action = at most one SMS = one charge).

### Example call (TypeScript / fetch)

```ts
type BookingAction = 'on_the_way' | 'job_started' | 'job_completed';

async function runBookingAction(opts: {
  apiBaseUrl: string;
  accessToken: string;
  bookingId: string;
  action: BookingAction;
}): Promise<
  | { ok: true; jobStatus: string; smsSent: boolean; smsReason?: string }
  | { ok: false; status: number; error: string; retryAfterSec?: number }
> {
  const res = await fetch(
    `${opts.apiBaseUrl}/api/availability/bookings/${opts.bookingId}/actions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: opts.action }),
    }
  );

  const body = (await res.json().catch(() => ({}))) as {
    jobStatus?: string;
    sms?: { sent: boolean; reason?: string };
    error?: string;
  };

  if (res.ok) {
    return {
      ok: true,
      jobStatus: body.jobStatus ?? '',
      smsSent: body.sms?.sent ?? false,
      smsReason: body.sms?.reason,
    };
  }
  const retryAfter = res.headers.get('Retry-After');
  return {
    ok: false,
    status: res.status,
    error: body.error ?? 'Action failed',
    retryAfterSec: retryAfter ? Number(retryAfter) : undefined,
  };
}
```

### Notes for the app

- Drive button visibility from `job_status` (§3 table). Only show actions for `confirmed` bookings.
- On `200`: update the chip to the returned `jobStatus`; success toast/haptic. If `sms.sent === false`, add a soft "couldn't text customer" note.
- On `409`: the state moved on without you (already done / concurrent). Refetch the booking and re-render — no error toast.
- On `429`: honor `Retry-After`, disable temporarily.
- The server must have `PINGRAM_API_KEY` + a Pingram sender for SMS; if not, actions still transition state and report `sms.reason = "not_configured"`.

---

## Migrations (apply in Supabase)

| Migration                                                               | Purpose                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/sms/docs/migrations/001_sms_messages_table.sql`           | Create `sms_messages` (+ RLS, indexes).                                |
| `src/features/availability/docs/migrations/002_bookings_job_status.sql` | Add `bookings.job_status`.                                             |
| Drop legacy column                                                      | `alter table public.bookings drop column if exists on_my_way_sent_at;` |

---

## Related code

| Piece                       | Location                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Booking actions route       | `src/app/api/availability/bookings/[id]/actions/route.ts`                     |
| Action registry             | `src/features/availability/booking/server/bookingActionCatalog.ts`            |
| Booking completion (shared) | `src/features/availability/services/completeBookingWithSideEffects.ts`        |
| Job status type             | `src/features/availability/booking/jobStatus.ts`                              |
| Confirmation SMS (auto)     | `src/app/api/public/bookings/route.ts`, `src/app/api/stripe/webhook/route.ts` |
| Send + log                  | `src/features/sms/services/sendAndRecordSms.ts`                               |
| Low-level send              | `src/features/sms/services/sendSms.ts`                                        |
| Message templates           | `src/features/sms/messages/bookingSms.ts`                                     |
| Phone normalization         | `src/features/sms/utils/toE164.ts`                                            |
| Rate limiter                | `src/server/rateLimit/ownerSmsSendRateLimit.ts`                               |
| Auth helper                 | `src/libs/api/getAuthenticatedUser.ts`                                        |
