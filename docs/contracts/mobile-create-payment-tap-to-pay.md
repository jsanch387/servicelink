# Contract: Mobile — Create payment Tap to Pay

Owner collects in person from **Home → Create payment → Tap to pay**. Amount + a short note is the whole charge. There is **no booking**, **no customer**, and **no appointment**.

This is the server contract for `POST /api/payments/tap-to-pay/intent`. Mobile already posts this shape (`postTapToPayMerchantIntent.js`). Build against this file.

**Status:** Implemented in this repo.

**Stripe Connect prerequisite:** connected Express account with onboarding `complete` and **`charges_enabled`** — see [`mobile-stripe-connect-onboarding.md`](./mobile-stripe-connect-onboarding.md).

**Related:**

| Doc                                                                | What it is                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| [`mobile-create-payment-link.md`](./mobile-create-payment-link.md) | Same Get paid screen, payment-link path                      |
| [`mobile-booking-tap-to-pay.md`](./mobile-booking-tap-to-pay.md)   | Booking complete Tap to Pay (different route, has a booking) |

**Not this flow:** `POST /api/availability/bookings/{bookingId}/tap-to-pay/intent`. Do not send a booking id. Do not call `job_completed`.

---

## Product summary

```text
Home FAB → Create payment → Tap to pay
  → amount + note
  → Charge
      1. POST /api/payments/tap-to-pay/intent
      2. Stripe Terminal / Apple Tap to Pay UI (clientSecret)
      3. Owner toast “Paid” and close
```

There is **no ServiceLink sheet** after Charge. The reader is the UI. **Do not poll.** **Do not** write `payment_requests` or create the PaymentIntent in the app.

| Step | Mobile UI                | Server                                                                      |
| ---- | ------------------------ | --------------------------------------------------------------------------- |
| 1    | Amount + “what’s it for” | Auth + Connect gate                                                         |
| 2    | Charge                   | `ensureTerminalLocation` + PI on the connected account                      |
| 3    | Native Tap to Pay UI     | Insert `payment_requests` (`status: open`, `collection_method: tap_to_pay`) |
| 4    | Owner toast “Paid”       | Connect webhook marks the row `paid`                                        |

Warm-up uses **`POST /api/payments/tap-to-pay/connection-token`** (merchant-scoped, no booking). Do **not** use the booking `…/bookings/{id}/tap-to-pay/connection-token` for this screen.

Expo Go cannot open the reader. A **dev / production iOS build** with Terminal + the Tap to Pay entitlement can. The intent route still works without a phone tap (curl / logs).

Cancel on Apple’s UI is **not** an error. Charge again creates a **new** PaymentIntent.

---

## Endpoints

| Method | Path                                        | Purpose                                 |
| ------ | ------------------------------------------- | --------------------------------------- |
| `POST` | `/api/payments/tap-to-pay/intent`           | Walk-up PaymentIntent for amount + note |
| `POST` | `/api/payments/tap-to-pay/connection-token` | Merchant Terminal token (app warm-up)   |

**Example (local):** `http://localhost:3000/api/payments/tap-to-pay/intent`

**LAN / device:** same origin as `resolveStripeMobileCheckoutOrigin()` / `EXPO_PUBLIC_WEB_APP_URL`.

**Central paths:** `API_ROUTES.PAYMENTS_TAP_TO_PAY_INTENT` and `API_ROUTES.PAYMENTS_TAP_TO_PAY_CONNECTION_TOKEN` in `src/constants/routes.ts`.

---

## Headers

| Header          | Required | Value                            |
| --------------- | -------- | -------------------------------- |
| `Authorization` | yes      | `Bearer <Supabase access_token>` |
| `Content-Type`  | yes      | `application/json`               |
| `Accept`        | no       | `application/json`               |
| `X-Request-ID`  | no       | UUID; echoed as `X-Request-ID`   |

Same JWT as `POST /api/payments/link`. Server resolves `business_id` from the signed-in profile. **Do not** send `businessId`.

Cookie auth (web) is also accepted. Mobile always sends Bearer.

---

## Request body (`/intent`)

```json
{
  "amountCents": 4000,
  "currency": "usd",
  "note": "Lights",
  "stripeAccountId": "acct_…"
}
```

| Field             | Required | Type    | Rules                                                                  |
| ----------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `amountCents`     | yes      | integer | `50`–`999999` (Stripe $0.50 min; mobile keypad cap $9,999.99)          |
| `currency`        | no       | string  | Must be `usd` when sent. Defaults to `usd`.                            |
| `note`            | yes      | string  | Trimmed, non-empty, max **200**. Goes on the PI description + metadata |
| `stripeAccountId` | no       | string  | Sent when mobile knows it. Must match this business’s `acct_…`.        |

`note` is the only description of the charge (“Lights”, “Cabin detail”). Do not send a customer, booking id, or phone.

---

## Success (`/intent`, HTTP 200)

```json
{
  "success": true,
  "paymentIntentId": "pi_…",
  "clientSecret": "pi_…_secret_…",
  "amountCents": 4000,
  "currency": "usd",
  "terminalLocationId": "tml_…",
  "stripeAccountId": "acct_…",
  "merchantDisplayName": "Acme Detail"
}
```

| Field                 | Required for mobile | Notes                                                     |
| --------------------- | ------------------- | --------------------------------------------------------- |
| `success`             | yes                 | Must be `true`                                            |
| `paymentIntentId`     | yes                 |                                                           |
| `clientSecret`        | yes                 | Terminal `retrievePaymentIntent` / `processPaymentIntent` |
| `amountCents`         | yes                 | Echo the charged amount                                   |
| `currency`            | yes                 | `usd`                                                     |
| `terminalLocationId`  | yes                 | Empty → collection fails even if the PI is valid          |
| `stripeAccountId`     | yes                 | Empty → collection fails                                  |
| `merchantDisplayName` | no                  | Business name for the Terminal reader UI                  |

Server also sends `locationId` and `stripe_terminal_location_id` as aliases of `terminalLocationId` (`parseTapToPayIntentConnectParams.js`).

Charge model is **direct charges** on the connected account. Mobile does **not** pass `onBehalfOf` to `easyConnect`.

---

## Errors

Body is always `{ "success": false, "error": "human-readable message" }` with a real HTTP status. `X-Request-ID` is echoed when present.

| Status  | When                                      | Example `error`                                                                                                                                                            |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401     | Signed out / bad token                    | `Sign in again to collect payment.`                                                                                                                                        |
| 400     | Bad amount, note, currency, or account id | `Enter an amount greater than $0.` / `Add a short note for what this payment is for.` / `Only USD payments are supported.` / `stripeAccountId must be a non-empty string.` |
| 404     | No business profile                       | `Business profile not found`                                                                                                                                               |
| 422     | Connect not ready                         | `Set up Stripe payments to use Tap to Pay.`                                                                                                                                |
| 403     | `stripeAccountId` mismatch                | `Stripe account does not match this business.`                                                                                                                             |
| 429     | Rate limited                              | `Too many Tap to Pay requests. Please wait a moment and try again.`                                                                                                        |
| 500/502 | Persist or Stripe create failed           | `Couldn't start Tap to Pay. Try again.`                                                                                                                                    |

`429` includes `Retry-After` (seconds). Intent limits are **15/min and 80/hour per owner** (also IP caps), shared with booking Tap to Pay.

Treat **404** as “no business,” and **422** as “finish Stripe setup.”

---

## Connect / payments gate

| Check                                | Required   |
| ------------------------------------ | ---------- |
| Signed-in owner                      | yes        |
| `business_profiles` row              | yes        |
| `payment_accounts.stripe_account_id` | yes        |
| `payment_accounts.onboarding_status` | `complete` |
| `payment_accounts.charges_enabled`   | `true`     |

If the gate fails → **422**. Hide or disable Tap to pay in the UI until Connect is ready (same as payment link).

Does **not** require `payment_settings.payments_enabled` (that flag is booking checkout only).

---

## Connection token (warm-up)

Walk-up collection uses the **merchant** token, not the booking fallback.

`POST /api/payments/tap-to-pay/connection-token`

Body may be empty `{}` or `{ "stripeAccountId": "acct_…" }` (must match this business when sent).

Success:

```json
{
  "success": true,
  "secret": "pst_…"
}
```

Same auth, Connect gate, `X-Request-ID` echo, and `{ success: false, error }` errors as `/intent` (401 copy is also `Sign in again to collect payment.`). Connection-token limits are more generous (warm-up + SDK refresh).

---

## After the customer taps

Stripe confirms the PaymentIntent. Mobile does **not** call a second route.

Connect webhook (`/api/stripe/webhook-connect`):

| Event                           | Server                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| `payment_intent.succeeded`      | Amount matches → `payment_requests.status = paid`. Mismatch → `failed` |
| `payment_intent.canceled`       | Open row → `canceled`                                                  |
| `payment_intent.payment_failed` | Open row → `failed`                                                    |
| Owner backs out of Apple UI     | Unused PI may expire; leave the open row                               |

Lookup is by `metadata.paymentRequestId` or `pi_…`. Kind is `walkup_tap_to_pay` (booking complete uses `booking_tap_to_pay` and is ignored). **Do not** write `booking_payments`. **Do not** call `job_completed`.

Owner toast is **Paid**. That is the only confirmation in v1. Mobile does **not** wait for the webhook.

Add **`payment_intent.succeeded`**, **`payment_intent.canceled`**, and **`payment_intent.payment_failed`** on the Connect webhook destination if they are not selected yet.

---

## Receipts / confirmation (not this pass)

Walk-up Tap to Pay and payment links have **no ServiceLink customer receipt** today. There is no customer on the charge.

- Do **not** send review invite, job SMS, or invoice email.
- Stripe / the card network may still notify the cardholder. That is fine.
- A later pass can add an optional owner-entered email/phone. Do not block Charge on that.

---

## What mobile must not do

- Create the PaymentIntent in the app
- Insert / update `payment_requests` from the client
- Attach this charge to a booking, quote, or CRM customer
- Require a customer picker
- Use the booking connection-token for walk-up collection
- Pass `onBehalfOf` to Terminal / `easyConnect`
- Treat cancel on Apple’s UI as an error
- Poll for paid status (v1)
- Call a second complete route after a successful tap

---

## Verification

```bash
curl -sS -X POST "$ORIGIN/api/payments/tap-to-pay/intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -d '{"amountCents":4000,"currency":"usd","note":"Lights"}'
```

Expect **200** with `paymentIntentId`, `clientSecret`, `terminalLocationId`, and `stripeAccountId`.

On a signed iOS build: Charge opens Apple Tap to Pay. Cancel is not an error. Success → owner toast **Paid**. Row later flips to `paid` via webhook.

---

## Out of scope (later)

- Customer receipt / confirmation email or SMS
- Attaching this charge to a booking, quote, or CRM customer
- Live Transactions list
- Android Tap to Pay
