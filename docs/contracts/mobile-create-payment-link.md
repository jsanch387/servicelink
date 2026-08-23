# Contract: Mobile — Create payment link

Owner creates a **one-time** Stripe Checkout URL from **Home → Create payment → Payment link**. Amount + a short note is the whole charge. There is **no booking**, **no customer**, and **no appointment**.

This is the server contract for `POST /api/payments/link`. Mobile already posts this shape (`postCreatePaymentLink.js`). Build against this file.

**Stripe Connect prerequisite:** connected Express account with onboarding `complete` and **`charges_enabled`** — see [`mobile-stripe-connect-onboarding.md`](./mobile-stripe-connect-onboarding.md).

**Not this flow:** booking Tap to Pay (`mobile-booking-tap-to-pay.md`). Create-payment **Tap to Pay** (`POST /api/payments/tap-to-pay/intent`) is a later pass.

---

## Product summary

```text
Home FAB → Create payment → Payment link
  → enter amount + note
  → Create payment link
      1. POST /api/payments/link
      2. Show “Payment link ready”
      3. Owner Share or Copy the returned URL
```

Mobile only needs a live HTTPS URL back. That URL is a **short ServiceLink link** (`https://myservicelink.app/p/K7mN2pQx`), not the raw Stripe Checkout URL. The customer opens it, sees amount + note, and taps Pay — then Stripe Checkout. **Do not poll.** **Do not** write `payment_requests` or call Stripe from the app.

| Step | Mobile UI                         | Server                                                                 |
| ---- | --------------------------------- | ---------------------------------------------------------------------- |
| 1    | Amount + “what’s it for”          | Auth + Connect gate                                                    |
| 2    | Create payment link               | Insert `payment_requests` (`status: open`)                             |
| 3    | Share / Copy                      | Checkout Session on the connected account; return short `/p/…` `url`   |
| 4    | (customer pays; owner is done)    | Webhook marks the row `paid`                                           |

---

## Endpoint

| Method | Path                   | Purpose                                      |
| ------ | ---------------------- | -------------------------------------------- |
| `POST` | `/api/payments/link`   | Create a one-time pay URL for amount + note  |

**Example (local):** `http://localhost:3000/api/payments/link`

**LAN / device:** same path on whatever origin `resolveStripeMobileCheckoutOrigin()` / `EXPO_PUBLIC_WEB_APP_URL` already uses for other Stripe mobile routes.

**Central path:** `API_ROUTES.PAYMENTS_LINK` in `src/constants/routes.ts`.

---

## Headers

| Header           | Required | Value                                 |
| ---------------- | -------- | ------------------------------------- |
| `Authorization`  | yes      | `Bearer <Supabase access_token>`      |
| `Content-Type`   | yes      | `application/json`                    |
| `Accept`         | no       | `application/json`                    |
| `X-Request-ID`   | no       | UUID; echoed as `X-Request-ID`        |

Same JWT as other owner payment routes. Server resolves `business_id` from the signed-in profile. **Do not** send `businessId`.

Cookie auth (web) is also accepted.

---

## Request body

```json
{
  "amountCents": 4000,
  "currency": "usd",
  "note": "Lights"
}
```

| Field          | Required | Type     | Rules                                                                 |
| -------------- | -------- | -------- | --------------------------------------------------------------------- |
| `amountCents`  | yes      | integer  | `50`–`999999` (Stripe $0.50 min; mobile keypad cap $9,999.99)         |
| `currency`     | no       | string   | Must be `usd` when sent. Defaults to `usd`.                           |
| `note`         | yes      | string   | Trimmed, non-empty, max **200** chars. Becomes the Checkout line name |

`note` is the only description of the charge (“Lights”, “Cabin detail”). Do not send a customer, booking id, or phone.

---

## Success (HTTP 200)

```json
{
  "success": true,
  "url": "https://myservicelink.app/p/K7mN2pQx",
  "paymentLinkId": "cs_…",
  "paymentRequestId": "<uuid>"
}
```

| Field               | Required for mobile | Notes                                                                 |
| ------------------- | ------------------- | --------------------------------------------------------------------- |
| `success`           | yes                 | Must be `true`                                                        |
| `url`               | yes                 | Short ServiceLink pay page. Copy / share **exactly** this string      |
| `paymentLinkId`     | no                  | Stripe Checkout Session id (`cs_…`)                                   |
| `paymentRequestId`  | no                  | Server `payment_requests.id`                                          |

`url` looks like `{origin}/p/{8-char-code}`. On a device hitting LAN it will be `http://192.168.x.x:3000/p/…`. **Never** share the `checkout.stripe.com/c/pay/cs_…` URL.

Share preview (iMessage / WhatsApp / Slack) is **generic on purpose**: title **Payment Link**, description **Secure checkout**, dollar-mark icon — not the amount, note, or ServiceLink logo. Previews only work on **public HTTPS** (production). A `192.168…` LAN link usually will not unfurl.

Mobile may also read the URL from `paymentUrl` or `checkoutUrl` if `url` is missing. Server always sends `url`.

**Do not** open Checkout in the owner app. The owner shares the URL; the **customer** opens it.

---

## Errors

Body is always `{ "success": false, "error": "human-readable message" }` with a real HTTP status.

| Status  | When                                      | Example `error`                                              |
| ------- | ----------------------------------------- | ------------------------------------------------------------ |
| 401     | Signed out / bad token                    | `Sign in again to create a payment link.`                    |
| 400     | Invalid amount, note, or currency         | `Enter an amount greater than $0.` / `Add a short note…`     |
| 404     | No business profile for this user         | `Business profile not found`                                 |
| 422     | Connect not ready                         | `Set up Stripe payments to create a payment link.`           |
| 429     | Rate limited (10/min, 40/hour per owner)  | `Too many payment links. Please wait a moment and try again.` |
| 500/502 | Persist or Stripe create failed           | `Could not create a payment link.` / `Could not start checkout.` |

`429` includes `Retry-After` (seconds).

Mobile today maps **404** to: *Payment links aren’t available yet. Try again later.* That was for the route missing. The route exists now — treat 404 as “no business,” and use **422** for “finish Stripe setup.”

---

## Connect / payments gate

| Check                                  | Required                          |
| -------------------------------------- | --------------------------------- |
| Signed-in owner                        | yes                               |
| `business_profiles` row                | yes                               |
| `payment_accounts.stripe_account_id`   | yes                               |
| `payment_accounts.onboarding_status`   | `complete`                        |
| `payment_accounts.charges_enabled`     | `true`                            |

If the gate fails → **422**. Hide or disable Payment link in the UI until Connect is ready (same as booking Tap to Pay).

---

## Link lifetime (what mobile should tell the owner)

The shared URL is **`{origin}/p/{shortCode}`** (8 characters). It is a **one-time Checkout Session**, not a reusable Stripe Payment Link.

| Situation                         | What happens                                      |
| --------------------------------- | ------------------------------------------------- |
| Customer pays                     | URL cannot collect again                          |
| Customer cancels / closes the tab | Same URL still works until it expires             |
| No payment for **24 hours**       | Stripe expires the session; `/p/…` says the link expired and to ask the business for a new one |
| Owner taps Create again           | Brand-new URL; old one is unchanged               |

Anyone with the URL can pay. Treat it like cash. Two creates = two charges if both are paid.

Mobile does **not** confirm payment. Share / copy can happen before the customer pays.

---

## After the customer pays (or the link expires)

Connect webhook (`/api/stripe/webhook-connect`):

| Event                         | Server                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| `checkout.session.completed`  | Amount matches → `status = paid`. Mismatch → `failed`.                      |
| `checkout.session.expired`    | Open row → `status = expired` (24 hours, no payment)                        |

Lookup is by `metadata.paymentRequestId` or `cs_…`. **Do not** call a second “complete” route. **Do not** write `booking_payments`.

Customer pages (web, not mobile):

| Situation              | Page                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| Opens shared URL       | `/p/{code}` receipt → Pay → Stripe Checkout                          |
| Pays                   | `/pay/complete?status=success` — “Payment successful”                |
| Cancels / back         | Same `/p/{code}` receipt (still payable until expiry)                |
| Already paid           | `/p/{code}` — “Already paid”                                         |
| Expired (24 hours)     | `/p/{code}` — “This link expired. Ask {business} for a new one.”     |

Add **`checkout.session.expired`** on the Connect webhook destination if it is not selected yet. `/p/…` also checks Stripe on load so a late webhook does not show Pay on a dead session.

---

## What mobile must not do

- Call Stripe Checkout or Payment Links APIs directly
- Insert / update `payment_requests` from the client
- Attach this charge to a booking, quote, or CRM customer
- Require a customer picker
- Poll for paid status (v1)

---

## Out of scope (later)

- Create-payment Tap to Pay (`POST /api/payments/tap-to-pay/intent`)
- Deposit links on appointment create
- Auto-text the URL
- In-app “this link was paid” list
- Owner revoke / expire a live link
