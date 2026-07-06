# Contract: Mobile — Tap to Pay (Complete sheet / Phase 2)

> **SMS outbound paused (2026-07):** After a successful tap, `job_completed` sends the invoice link via **email** when the customer has an email address. Do not expect receipt SMS. See [`../sms-outbound-paused.md`](../sms-outbound-paused.md).

Owner collects the **remaining balance** on-site using **Stripe Tap to Pay on iPhone**:

**Prerequisite lifecycle:** [`mobile-booking-work-finished.md`](./mobile-booking-work-finished.md) (Done/Skip) → Complete sheet per [`mobile-booking-job-completed.md`](./mobile-booking-job-completed.md).

**Stripe Connect prerequisite:** Business must have a connected Express account with **`charges_enabled`** — see [`mobile-stripe-connect-onboarding.md`](./mobile-stripe-connect-onboarding.md).

**Golden rule:** Tap to Pay is a **convenience** path. **Mark as paid** (`cash` / `payment_app` / `other`) from Phase 1 always remains available. A failed or cancelled tap must **never** block completion.

---

## Product summary

Tap to Pay does **not** use Stripe Checkout and does **not** open a browser. The server creates a **PaymentIntent** on the business’s **Connect account**; the mobile **Terminal / Tap to Pay SDK** collects the card tap on-device using the returned `clientSecret`.

| Step | Mobile UI                                     | Server                                                                       |
| ---- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Complete sheet shows line items + balance due | Booking + `booking_payments` (Phase 1)                                       |
| 2    | Owner taps **Tap to Pay**                     | `POST …/tap-to-pay/connection-token` (SDK init, once per session)            |
| 3    | SDK ready; owner confirms amount              | `POST …/tap-to-pay/intent` with current `sessionFees`                        |
| 4    | Native Tap to Pay UI; customer taps card      | Stripe confirms PaymentIntent on Connect account                             |
| 5    | SDK reports success                           | `POST …/actions` `job_completed` with `tap_to_pay` + `stripePaymentIntentId` |
| 6    | Success toast; sheet closes                   | Persist fees, payment, invoice, **email** receipt when address on file       |

**Do not** call Supabase to update payment state directly. **Do not** skip `job_completed` after a successful tap — that action is what writes the invoice, marks the booking complete, and sends the receipt SMS.

---

## Architecture (what is _not_ used)

| Used today (online booking)  | Tap to Pay (Phase 2)                       |
| ---------------------------- | ------------------------------------------ |
| Stripe **Checkout Session**  | Stripe **PaymentIntent**                   |
| Customer redirect in browser | Native SDK on owner’s iPhone               |
| Webhook creates booking      | Booking already exists                     |
| `booking_checkout_sessions`  | `booking_tap_to_pay_intents` (new, see DB) |

---

## Endpoints overview

| #   | Method | Path                                                                 | Purpose                                                |
| --- | ------ | -------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/connection-token` | Short-lived Terminal connection token for SDK          |
| 2   | `POST` | `/api/availability/bookings/{bookingId}/tap-to-pay/intent`           | Create PaymentIntent for current amount due            |
| 3   | `POST` | `/api/availability/bookings/{bookingId}/actions`                     | `job_completed` — verify PI + persist (existing route) |

**Example (local):** `http://localhost:3000/api/availability/bookings/<id>/tap-to-pay/intent`

### Shared headers (all three)

| Header          | Value                                 |
| --------------- | ------------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>`      |
| `Content-Type`  | `application/json`                    |
| `Accept`        | `application/json`                    |
| `X-Request-ID`  | Optional UUID (echoed in server logs) |

Auth and ownership match the booking actions route: authenticated owner, booking belongs to owner’s business.

---

## Amount-due math (must match Complete sheet)

Same formula as [`mobile-booking-job-completed.md`](./mobile-booking-job-completed.md):

```
subtotalCents =
  service_price_cents
  + sum(addon_details[].priceCents)
  + sum(sessionFees[].amountCents)

amountDueCents =
  subtotalCents
  - booking_payments.paid_online_amount_cents
```

For **intent creation**, there is no `sessionPayment` yet — the intent amount is **`amountDueCents`**.

For **`job_completed`**, mobile sends `sessionPayment.amountCents` equal to the succeeded tap amount (must match the verified PaymentIntent amount and bring amount due to **0**).

---

## Booking preconditions (all Tap to Pay endpoints)

| Check                          | Required                                                |
| ------------------------------ | ------------------------------------------------------- |
| `bookings.status`              | `confirmed`                                             |
| `bookings.job_status`          | Not `completed`                                         |
| `amountDueCents`               | **> 0** for intent; **0** after tap for `job_completed` |

### Stripe / Connect preconditions

| Check                                | Required                                                      |
| ------------------------------------ | ------------------------------------------------------------- |
| `payment_accounts.stripe_account_id` | Present                                                       |
| Connect account                      | `charges_enabled === true` (sync via connect onboarding flow) |
| `payment_settings.payments_enabled`  | Recommended gate in mobile UI (server may enforce)            |

If Connect is not ready, return **422** with a message the app can show inline (e.g. “Finish Stripe setup to use Tap to Pay”) and keep **Mark as paid** visible.

---

## 1. Connection token

### `POST /api/availability/bookings/{bookingId}/tap-to-pay/connection-token`

**Request body:**

```json
{
  "stripeAccountId": "acct_…"
}
```

| Field             | Required | Notes                                                                                                      |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `stripeAccountId` | No       | When sent (after intent loads), must match `payment_accounts.stripe_account_id` for the booking’s business |

**Success (200):**

```json
{
  "success": true,
  "secret": "pst_…",
  "stripeAccountId": "acct_…",
  "terminalLocationId": "tml_…"
}
```

| Field                | Notes                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| `secret`             | Stripe Terminal connection token; pass to SDK `setConnectionToken` / equivalent |
| `stripeAccountId`    | Connected account the token was created on (for debugging / alignment)          |
| `terminalLocationId` | Terminal location the token is scoped to (same as intent response)              |

**Mobile SDK (direct charges):**

- Connection token and PaymentIntent are both on the connected account (`acct_…`).
- `easyConnect` must use `locationId` only — **do not** pass `onBehalfOf` (that is for destination charges with platform-scoped PIs).
- `stripeAccountId` in API responses is for token-request alignment and logging, not for `SCPTapToPayConnectionConfiguration.onBehalfOf`.

**Server implementation:**

1. Load booking + business; verify ownership and preconditions above (except amount due may be 0 — still allow token if booking is completable; mobile typically calls when amount > 0).
2. Load `payment_accounts.stripe_account_id`.
3. If body includes `stripeAccountId`, reject **400** when it does not match the business Connect account.
4. Call `issueTapToPayConnectionToken` (connection token on connected account, scoped to `tml_…`).
5. Return `secret` + `stripeAccountId`.

**Mobile usage:**

- Call once when initializing Terminal / Tap to Pay for an app session (or per Stripe SDK guidance).
- Retry on SDK “connection token expired” errors.
- Does **not** create a charge.

### Errors

| HTTP    | When                                  | Suggested `error` copy                                     |
| ------- | ------------------------------------- | ---------------------------------------------------------- |
| **401** | Invalid JWT                           | (standard)                                                 |
| **404** | Booking not found / not owned         | (standard)                                                 |
| **409** | Not confirmed or already completed      | (standard)                                                 |
| **422** | No Connect account / charges disabled | “Set up Stripe payments to use Tap to Pay.”                |
| **500** | Stripe failure                        | “Couldn’t connect to payments. Try again or mark as paid.” |

---

## 2. PaymentIntent (before tap UI)

### `POST /api/availability/bookings/{bookingId}/tap-to-pay/intent`

**Request body:**

```json
{
  "sessionFees": [{ "label": "Pet hair removal", "amountCents": 2500 }]
}
```

| Field         | Required | Rules                                                                               |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `sessionFees` | No       | Default `[]`. Same shape as `job_completed`. Must match Complete sheet at tap time. |

**Success (200):**

```json
{
  "success": true,
  "paymentIntentId": "pi_…",
  "clientSecret": "pi_…_secret_…",
  "amountCents": 12000,
  "currency": "usd",
  "terminalLocationId": "tml_…",
  "stripeAccountId": "acct_…",
  "merchantDisplayName": "Acme Detailing"
}
```

| Field                 | Notes                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `paymentIntentId`     | Store for `job_completed.sessionPayment.stripePaymentIntentId`                           |
| `clientSecret`        | Pass to Terminal SDK to collect + confirm                                                |
| `amountCents`         | Server-computed amount due; display in UI before tap                                     |
| `currency`            | Lowercase ISO-4217 from `booking_payments`                                               |
| `terminalLocationId`  | Stripe Terminal Location on the connected account (`tml_…`); required for SDK collection |
| `stripeAccountId`     | Connect account id (`acct_…`); for connection-token alignment and logging only           |
| `merchantDisplayName` | Business name for Terminal reader UI                                                     |

**Server implementation:**

1. Parse `sessionFees`; compute `amountDueCents` via `computeBookingAmountDue.ts`.
2. Reject **400** if `amountDueCents === 0` (“Nothing to collect for this booking.”).
3. Verify Connect account ready.
4. **`ensureTerminalLocation(businessId)`** — create or reuse Stripe Terminal Location on the connected account; persist `payment_accounts.stripe_terminal_location_id`. Reject **500** if provisioning fails (do not return empty `terminalLocationId`).
5. **Cancel or supersede** any open intent for this booking in `requires_payment_method` / `requires_confirmation` state (best-effort `paymentIntents.cancel` on Connect account) so stale amounts cannot be tapped.
6. Create PaymentIntent on **connected account** via `getStripeConnectClient(acct_…)` (equivalent to `{ stripeAccount: acct_… }` on every request):

   ```text
   connectClient.paymentIntents.create({
     amount: amountDueCents,
     currency,
     payment_method_types: ['card_present'],
     capture_method: 'automatic',
     metadata: {
       kind: 'booking_tap_to_pay',
       bookingId,
       businessId,
     },
   })
   ```

   Do **not** use `on_behalf_of` or `transfer_data`. After create, `verifyTapToPayDirectChargeOnConnectedAccount` rejects platform-scoped PIs before returning 200.

7. Insert row in **`booking_tap_to_pay_intents`** (see Database).
8. Return ids + secrets + Terminal connect fields to mobile.

**Mobile usage:**

- Call when owner taps **Tap to Pay**, **after** fees are final for this attempt.
- If owner **adds or edits a fee** after an intent was created, **discard** the old intent client-side and call this endpoint again (new amount).
- If this call fails, show error; owner can retry or use Mark as paid.

### Errors

| HTTP    | When                                   | Suggested `error` copy                                  |
| ------- | -------------------------------------- | ------------------------------------------------------- |
| **400** | Invalid `sessionFees`; amount due is 0 | “Nothing to collect.” / validation message              |
| **401** | Invalid JWT                            | (standard)                                              |
| **404** | Booking not found                      | (standard)                                              |
| **409** | Not confirmed or already completed     | (standard)                                              |
| **422** | Connect not ready                      | “Set up Stripe payments to use Tap to Pay.”             |
| **500** | Stripe / DB failure                    | “Couldn’t start Tap to Pay. Try again or mark as paid.” |

---

## 3. Complete job (after successful tap)

### `POST /api/availability/bookings/{bookingId}/actions`

Unchanged route — extended verification for `tap_to_pay`. Full contract: [`mobile-booking-job-completed.md`](./mobile-booking-job-completed.md).

**Request body (Tap to Pay path):**

```json
{
  "action": "job_completed",
  "sessionFees": [{ "label": "Pet hair removal", "amountCents": 2500 }],
  "sessionPayment": {
    "method": "tap_to_pay",
    "amountCents": 12000,
    "stripePaymentIntentId": "pi_…"
  }
}
```

| Field                                  | Required | Rules                                     |
| -------------------------------------- | -------- | ----------------------------------------- |
| `sessionPayment.method`                | Yes      | `"tap_to_pay"`                            |
| `sessionPayment.amountCents`           | Yes      | Must equal succeeded PaymentIntent amount |
| `sessionPayment.stripePaymentIntentId` | Yes      | From step 2 / SDK result                  |

**New server verification (Phase 2 — replaces today’s 400 stub):**

Before persist, retrieve PaymentIntent from Stripe on the **same connected account** and assert:

| Check                                           | Failure                                    |
| ----------------------------------------------- | ------------------------------------------ |
| PI exists                                       | **400** “Payment could not be verified.”   |
| `status === 'succeeded'`                        | **400** “Payment has not completed yet.”   |
| `amount === sessionPayment.amountCents`         | **400** “Payment amount does not match.”   |
| `metadata.bookingId === bookingId`              | **400** “Payment is not for this booking.” |
| `metadata.kind === 'booking_tap_to_pay'`        | **400** “Invalid payment type.”            |
| PI not already used for a **different** booking | **409** “This payment was already used.”   |

**Idempotency:**

- Booking already `completed` with same PI → **200** (same as Phase 1 idempotent retry).
- Booking already `completed` with **different** PI → **409**.

**Success (200):** Same as Phase 1 — `invoicePublicToken`, `sms`, `email`, statuses `completed`.

**Persist (existing Phase 1):**

- `booking_payments.session_payment_method = 'tap_to_pay'`
- `booking_payments.session_payment_amount_cents`
- `booking_payments.session_payment_stripe_payment_intent_id = pi_…`
- `booking_payments.provider` → set to `'stripe'` when method is `tap_to_pay` (server implementation detail)
- Fee lines, invoice snapshot, customer notification — unchanged.

**Mobile usage:**

- Call **only after** SDK reports PaymentIntent **succeeded**.
- Pass the **same** `sessionFees` used when creating the intent.
- On **200**: close sheet, refresh Next Up, show success toast (reuse `bookingActionFeedback` patterns).
- On **400** verification failure: show error; do **not** assume payment failed — owner may retry `job_completed` with same PI if PI is succeeded (network blip).
- On SDK failure / cancel: stay on Complete sheet; no `job_completed`; offer Mark as paid.

---

## Mobile integration checklist

### SDK sequence (reference)

```text
1. [Once per app session] POST …/connection-token → secret → SDK init
2. Owner taps Tap to Pay on Complete sheet
3. POST …/intent { sessionFees } → paymentIntentId, clientSecret, amountCents
4. SDK: discover Tap to Pay reader → collectPaymentMethod → confirmPaymentIntent
5. On SDK success → POST …/actions job_completed with tap_to_pay + stripePaymentIntentId
6. On 200 → success UI
```

### UI states (recommended)

| State                    | UI                                                 |
| ------------------------ | -------------------------------------------------- |
| Loading intent           | Disable Tap to Pay button; spinner                 |
| SDK collecting           | Full-screen or modal “Hold card near iPhone…”      |
| SDK success → completing | “Completing…” while `job_completed` in flight      |
| Intent / SDK error       | Inline error + **Try again** + **Mark as paid**    |
| Connect not ready        | Hide or disable Tap to Pay; link to payments setup |

### Fee changes invalidate intent

If `sessionFees` change after step 3, mobile must **not** confirm the old `clientSecret`. Request a **new intent** before another tap attempt.

### Fallback (always available)

```json
{
  "action": "job_completed",
  "sessionFees": […],
  "sessionPayment": { "method": "cash", "amountCents": 12000 }
}
```

No Tap to Pay endpoints required for this path.

---

## Database

### Existing (Phase 1 — no schema change required for basic flow)

| Table / column                                              | Role                            |
| ----------------------------------------------------------- | ------------------------------- |
| `booking_payments.session_payment_method`                   | `'tap_to_pay'`                  |
| `booking_payments.session_payment_amount_cents`             | Tap amount                      |
| `booking_payments.session_payment_recorded_at`              | Completion time                 |
| `booking_payments.session_payment_stripe_payment_intent_id` | `pi_…`                          |
| `booking_session_fee_lines`                                 | Session fees at complete        |
| `booking_invoices`                                          | Receipt snapshot + public token |

### New table: `booking_tap_to_pay_intents`

**Migration file (server to add):** `docs/sql/booking_tap_to_pay_phase2_migration.sql`

Includes table, indexes, booking/business integrity trigger, `updated_at` trigger, **RLS** (owner SELECT only; writes via service role), and grants.

| Column                     | Type          | Nullable | Notes                                                                                 |
| -------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------- |
| `id`                       | `uuid`        | no       | PK, default `gen_random_uuid()`                                                       |
| `booking_id`               | `uuid`        | no       | FK → `bookings(id)` ON DELETE CASCADE                                                 |
| `business_id`              | `uuid`        | no       | FK → `business_profiles(id)`                                                          |
| `stripe_payment_intent_id` | `text`        | no       | UNIQUE                                                                                |
| `amount_cents`             | `int4`        | no       | Expected tap amount                                                                   |
| `currency`                 | `text`        | no       | e.g. `usd`                                                                            |
| `status`                   | `text`        | no       | `created`, `requires_payment_method`, `processing`, `succeeded`, `canceled`, `failed` |
| `session_fees_snapshot`    | `jsonb`       | no       | Default `[]` — fees at intent creation                                                |
| `job_completed_at`         | `timestamptz` | yes      | Set when `job_completed` succeeds                                                     |
| `canceled_at`              | `timestamptz` | yes      | When superseded or explicitly canceled                                                |
| `created_at`               | `timestamptz` | no       | default `now()`                                                                       |
| `updated_at`               | `timestamptz` | no       | default `now()`                                                                       |

**Indexes:**

- `idx_booking_tap_to_pay_intents_booking_id`
- `idx_booking_tap_to_pay_intents_stripe_pi` (unique on `stripe_payment_intent_id`)

**RLS:** Owner read for own `business_id`; writes server-only (service role / admin client).

**Optional follow-up columns:**

- `payment_accounts.stripe_terminal_location_id` — Stripe Terminal Location (`tml_…`); provisioned by `ensureTerminalLocation()` on Connect complete + first intent
- `payment_accounts.tap_to_pay_ready` — `true` after location is created successfully

---

## Webhooks (optional v1.1 — not blocking mobile UX)

Primary completion path is **synchronous verification** on `job_completed` so the owner gets immediate feedback.

Later, handle `payment_intent.succeeded` where `metadata.kind === 'booking_tap_to_pay'` for:

- Reconciliation if `job_completed` failed after a successful tap
- Updating `booking_tap_to_pay_intents.status`
- Ops / support tooling

**Do not** require webhook delivery for the mobile happy path.

---

## Error responses (shared shape)

```json
{ "success": false, "error": "Human-readable message" }
```

Mobile should map HTTP status + `error` string to toasts / inline alerts. Prefer server messages above for consistency.

---

## Server implementation checklist

| Task                                                          | Owner   | Status                               |
| ------------------------------------------------------------- | ------- | ------------------------------------ |
| SQL migration `booking_tap_to_pay_intents` + terminal columns | Backend | Migration in repo; run in Supabase   |
| `POST …/tap-to-pay/connection-token` route + handler          | Backend | Done                                 |
| `POST …/tap-to-pay/intent` route + handler                    | Backend | Done                                 |
| Stripe PI create on Connect account (`card_present`)          | Backend | Done                                 |
| Terminal Location provisioning (`ensureTerminalLocation`)     | Backend | Done                                 |
| PI verification in `handleJobCompletedAction.ts`              | Backend | Done                                 |
| Set `booking_payments.provider = 'stripe'` for tap_to_pay     | Backend | Done                                 |
| Update `booking_tap_to_pay_intents` on succeed / cancel       | Backend | Done                                 |
| Unit tests: amount due, PI verify, idempotency                | Backend | Partial                              |
| Wire mobile Complete sheet → three endpoints                  | Mobile  | Done                                 |
| Terminal SDK init + Tap to Pay UI                             | Mobile  | Blocked on Apple Tap to Pay approval |
| Fee-change → re-create intent                                 | Mobile  | Done                                 |
| Fallback Mark as paid unchanged                               | Mobile  | Done                                 |
| Webhook reconciliation (`payment_intent.succeeded`)           | Backend | Optional v1.1                        |

### Code map (backend)

| Concern                  | File                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| Connection token route   | `src/app/api/availability/bookings/[id]/tap-to-pay/connection-token/route.ts` |
| Intent route             | `src/app/api/availability/bookings/[id]/tap-to-pay/intent/route.ts`           |
| Shared types             | `src/features/availability/booking/server/tapToPayTypes.ts`                   |
| Booking + Connect loader | `src/features/availability/booking/server/resolveTapToPayBookingContext.ts`   |
| Terminal Location        | `src/features/payments/server/ensureTerminalLocation.ts`                      |
| Create PI + DB row       | `src/features/availability/booking/server/createBookingTapToPayIntent.ts`     |
| Connection token         | `src/features/availability/booking/server/createTapToPayConnectionToken.ts`   |
| Verify PI on complete    | `src/features/availability/booking/server/verifyTapToPayPaymentIntent.ts`     |
| Orchestration hook       | `handleJobCompletedAction.ts`                                                 |
| Amount due               | `computeBookingAmountDue.ts` (existing)                                       |
| Persist                  | `persistJobCompletedTransaction.ts` (existing)                                |
| Server doc               | `src/features/availability/docs/BOOKING_TAP_TO_PAY_SERVER.md`                 |
| SQL migration            | `docs/sql/booking_tap_to_pay_phase2_migration.sql`                            |

---

## curl smoke tests

Set `ORIGIN`, `TOKEN`, `BOOKING_ID`. Booking must be confirmed (not completed) with amount due > 0.

**Connection token:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/tap-to-pay/connection-token" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Intent:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/tap-to-pay/intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionFees": [{ "label": "Pet hair", "amountCents": 2500 }]
  }'
```

**Complete (after real SDK tap in staging — use actual `pi_…`):**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "job_completed",
    "sessionFees": [{ "label": "Pet hair", "amountCents": 2500 }],
    "sessionPayment": {
      "method": "tap_to_pay",
      "amountCents": 14500,
      "stripePaymentIntentId": "pi_REPLACE_ME"
    }
  }'
```

Verify: `booking_payments.session_payment_stripe_payment_intent_id` set, invoice row exists, SMS contains `/i/` link.

---

## Related contracts

| Doc                                                                            | Relationship                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------- |
| [`mobile-booking-job-completed.md`](./mobile-booking-job-completed.md)         | Phase 1 Complete + shared `job_completed` body |
| [`mobile-booking-work-finished.md`](./mobile-booking-work-finished.md)         | Required Done/Skip before Complete             |
| [`mobile-booking-actions.md`](./mobile-booking-actions.md)                     | Shared actions route + auth                    |
| [`mobile-stripe-connect-onboarding.md`](./mobile-stripe-connect-onboarding.md) | Connect setup before Tap to Pay                |
