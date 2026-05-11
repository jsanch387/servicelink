# Stripe integration

Checkout for the Pro plan is handled by creating a Stripe Checkout Session and redirecting the user to Stripe. When payment succeeds, the webhook updates the user's profile to Pro.

**Product summary (who gets Pro, what features are paywalled):** see [`docs/subscription-and-pro-features.md`](../../../../docs/subscription-and-pro-features.md) at the repo root.

## Environment variables

| Variable                                       | Required                           | Description                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                            | Yes                                | Stripe secret key (starts with `sk_`). From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys).                                                                                                                                   |
| `STRIPE_PRO_PRICE_ID`                          | Yes                                | Stripe Price ID for the Pro monthly plan (e.g. `price_xxx`). Create a Product in [Stripe Dashboard → Products](https://dashboard.stripe.com/products), then add a recurring price.                                                                              |
| `STRIPE_WEBHOOK_SECRET`                        | Yes (for webhook)                  | Signing secret (starts with `whsec_`). From Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret.                                                                                                                                          |
| `STRIPE_CONNECT_WEBHOOK_SECRET`                | Yes (for Connect webhook)          | Signing secret for `/api/stripe/webhook-connect` destination that listens to **Connected and v2 accounts** events (booking checkout payments).                                                                                                                  |
| `NEXT_PUBLIC_SITE_URL`                         | No                                 | Base URL for success/cancel redirects (e.g. `https://yoursite.com`). Falls back to `VERCEL_URL` or `http://localhost:3000`.                                                                                                                                     |
| `STRIPE_MOBILE_ONBOARDING_SUCCESS_URL`         | Yes for Expo onboarding trial      | Full URL Stripe redirects to after successful Checkout (e.g. custom scheme `servicelinkmobile://onboarding/stripe?result=success` or an `https://` bridge page). Only used when the client sends `client: "mobile"` with `source: "onboarding_trial_bridge"`.   |
| `STRIPE_MOBILE_ONBOARDING_CANCEL_URL`          | Yes for Expo onboarding trial      | Same as above, for cancel / abandon.                                                                                                                                                                                                                            |
| `STRIPE_MOBILE_UPGRADE_SUCCESS_URL`            | Yes for Expo paywall upgrade       | Success redirect when `client: "mobile"` **without** onboarding `source` (trial ended, canceled, `past_due`, etc.). See [`docs/contracts/mobile-upgrade-stripe-checkout.md`](../../../../docs/contracts/mobile-upgrade-stripe-checkout.md).                     |
| `STRIPE_MOBILE_UPGRADE_CANCEL_URL`             | Yes for Expo paywall upgrade       | Cancel redirect for the same mobile upgrade flow.                                                                                                                                                                                                               |
| `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL`      | Yes for Expo “Manage subscription” | Where Stripe Customer Portal sends the user when they leave the portal (deep link or bridge). Only used when `POST /api/stripe/create-portal-session` body includes `client: "mobile"`.                                                                         |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL`  | Yes for Expo Connect onboarding    | Stripe Connect **Account Link** `return_url` when `POST /api/stripe/connect/onboard` body includes `client: "mobile"`. Must be **`https://…`** or **`http://…`** (Stripe rejects custom schemes like `myapp://` — use an https bridge page that opens the app). |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` | Yes for Expo Connect onboarding    | Account Link `refresh_url` (expired link / resume). Same **http(s)** rule as return URL.                                                                                                                                                                        |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL`   | Optional                           | Deep link that the bridge route opens for Connect return. Default: `servicelinkmobile://payments/connect?connect=return`.                                                                                                                                       |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_REFRESH_URL`  | Optional                           | Deep link that the bridge route opens for Connect refresh. Default: `servicelinkmobile://payments/connect?connect=refresh`.                                                                                                                                     |

## Flow

1. User clicks **Get Pro** on `/dashboard/upgrade` (or the plan card links there first).
2. Client calls `POST /api/stripe/create-checkout-session`.
3. API loads `profiles.stripe_customer_id` for the signed-in user, then creates a subscription Checkout Session and returns the session URL (see **One Stripe Customer per profile** below).
4. Client redirects to Stripe Checkout.
5. User completes payment on Stripe.
6. Stripe sends `checkout.session.completed` to `POST /api/stripe/webhook`.
7. Webhook verifies signature, records event id for idempotency, then updates `profiles`: `subscription_tier = 'pro'`, `subscription_status = 'active'`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_current_period_end`.
8. User is redirected to `{SITE_URL}/dashboard/settings?checkout=success`. They now have unlimited bookings (no monthly cap).

**Debug:** Onboarding + Stripe trial API routes emit **`[stripe:onboarding:…]`** `console.debug` lines when `NODE_ENV !== 'production'` or when **`DEBUG_STRIPE_ONBOARDING=1`** (see [`docs/contracts/mobile-onboarding-stripe-checkout.md`](../../../../docs/contracts/mobile-onboarding-stripe-checkout.md) → Server debugging).

## Onboarding step 5 (web) — silent trial (no Checkout redirect)

The in-app **Activate my link** button calls **`POST /api/stripe/start-onboarding-trial`** (cookies or Bearer, same auth as Checkout). The server creates a Stripe **Customer** (if needed) and a **Subscription** with **`trial_period_days: 7`** and the same trial end behavior as Checkout (`missing_payment_method: cancel`), then updates `profiles` and completes onboarding (same helpers as the Checkout webhook path). **No Stripe-hosted page** — the user stays in ServiceLink; **`customer.subscription.*`** webhooks continue to sync status.

If Stripe rejects silent subscription creation, the API may respond with **`fallbackToCheckout: true`** (for clients that still open hosted billing) plus a neutral **`error`** message. The onboarding **Go live** step in this app does not surface that path.

## Mobile app (Expo): onboarding step 5 — start free trial

Mobile typically uses **`POST /api/stripe/create-checkout-session`** with `source: onboarding_trial_bridge` and `client: "mobile"`, then opens `url` in an in-app browser. Auth uses the Supabase **access token**, not cookies.

1. **Request:** `POST /api/stripe/create-checkout-session` with header `Authorization: Bearer <supabase_access_token>` and JSON body:
   ```json
   { "source": "onboarding_trial_bridge", "client": "mobile" }
   ```
2. **Response:** `{ "success": true, "url": "https://checkout.stripe.com/...", "trial_checkout_followup": { ... } }` — open `url`. The **`trial_checkout_followup`** object points at **`POST /api/stripe/confirm-onboarding-trial`**, which returns **`trial_confirmation`** (profiles + Stripe trial dates) after Checkout completes.
3. **Return URLs:** Success/cancel use `STRIPE_MOBILE_ONBOARDING_SUCCESS_URL` and `STRIPE_MOBILE_ONBOARDING_CANCEL_URL`. Put **`{CHECKOUT_SESSION_ID}`** in the success URL so the app can call confirm with **`checkout_session_id`** ([Checkout success URL](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-success_url)).
4. **After success:** Call **`POST /api/stripe/confirm-onboarding-trial`** with `{ "checkout_session_id": "<id from success URL>" }` until **`synced_from_checkout`** is true (or poll with `{}` if the webhook already synced). Use **`trial_confirmation`** in the JSON for immediate UI. Webhooks still run in parallel; confirm is idempotent with the webhook.

**Optional:** same Bearer auth on **`POST /api/stripe/start-onboarding-trial`** skips Checkout and returns **`trial_confirmation`** immediately when Stripe allows silent subscription creation (see contract).

Full contract: [`docs/contracts/mobile-onboarding-stripe-checkout.md`](../../../../docs/contracts/mobile-onboarding-stripe-checkout.md).

## Mobile app (Expo): paywall — upgrade / resubscribe

Use the same `POST /api/stripe/create-checkout-session` endpoint when the user is paywalled and taps **Upgrade to Pro** (trial ended, subscription canceled/unpaid, card failed, etc.). Do **not** send `source: "onboarding_trial_bridge"` for this flow.

1. **Request body:** `{ "client": "mobile" }` — `client` must be `"mobile"` so upgrade deep-link env vars are used.
2. **Return URLs:** `STRIPE_MOBILE_UPGRADE_SUCCESS_URL` and `STRIPE_MOBILE_UPGRADE_CANCEL_URL`.
3. **Same Stripe Customer:** If `profiles.stripe_customer_id` is set, Checkout uses `customer: <id>` so returning users stay on one Customer; Stripe creates a **new** subscription for the new checkout (the old canceled subscription is not “reopened” — that is normal Stripe behavior). Webhook updates `stripe_subscription_id` from the completed session.

Contract: [`docs/contracts/mobile-upgrade-stripe-checkout.md`](../../../../docs/contracts/mobile-upgrade-stripe-checkout.md).

## One Stripe Customer per profile (Checkout)

**Problem we fixed:** If Checkout is created with only `customer_email` and no Stripe Customer id, Stripe may create a **new** `cus_…` on every completed session. The same person then appears as **multiple Customers** in the Dashboard (same email, different records). That is confusing for support, looks like “Link vs card” mismatches, and is easy to misread as double billing. Renewals still attach to the **subscription’s** Customer only—but duplicate rows create noise and distrust.

**What we do:** `POST /api/stripe/create-checkout-session` reads `profiles.stripe_customer_id`. When it is set (e.g. after a prior subscription, including after cancel—see **Subscription end**), the session is created with `customer: <stripe_customer_id>` so Stripe **reuses** that Customer. A new subscription after re-upgrade is created **on that same Customer**; the webhook continues to write the new `stripe_subscription_id` and period end from `checkout.session.completed`. When `stripe_customer_id` is still null (first-ever paid signup), the session uses `customer_email` so Stripe creates the Customer on first successful checkout, and the webhook stores the id.

**Operational note:** Legacy accounts may already have duplicate Customers in Stripe from before this behavior. You can leave inactive orphans alone or use Stripe’s tools to merge/delete duplicates; going forward, new checkouts from the app should stay on a single Customer per profile as long as `stripe_customer_id` was saved at least once.

**Out of scope:** Booking payments use Connect Checkout on **connected** accounts (`/api/public/booking-checkout`); that flow is unrelated to platform `profiles.stripe_customer_id` and is unchanged.

## Webhook idempotency table

We store event IDs for every event type we process: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Other events are acknowledged with 200 but not stored. Create this table in Supabase:

```sql
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
```

To add `event_type` to an existing table:

```sql
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS event_type text;
```

## Configuring webhooks in Stripe

We use **two** webhook destinations with different account scopes:

1. **Platform billing webhook** (`/api/stripe/webhook`)  
   Scope: **Your account**  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

2. **Connect booking checkout webhook** (`/api/stripe/webhook-connect`)  
   Scope: **Connected and v2 accounts**  
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` (and optionally `account.updated`).

Why this split: production booking payments are created on connected accounts. Without a connected-account destination, live customer charges can succeed while booking finalization webhook logic never runs.

1. Stripe Dashboard → Developers → Webhooks → Add destination.
2. Create destination #1: URL `https://your-domain.com/api/stripe/webhook`, scope **Your account**, select platform billing events.
3. Create destination #2: URL `https://your-domain.com/api/stripe/webhook-connect`, scope **Connected and v2 accounts**, select connect checkout events.
4. Copy signing secrets:
   - destination #1 → `STRIPE_WEBHOOK_SECRET`
   - destination #2 → `STRIPE_CONNECT_WEBHOOK_SECRET`
5. Redeploy after env updates.

## Customer portal (cancel / manage subscription)

Pro users see a **Manage subscription** button on Settings. It calls `POST /api/stripe/create-portal-session`, which creates a [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal) session and returns the URL. The user is redirected to Stripe’s hosted page where they can update payment method or **cancel subscription**. After they finish, Stripe sends them back to `/dashboard/settings`.

Enable the Customer Portal in Stripe: [Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal). Configure what customers can do (e.g. cancel subscription).

### Mobile app (Expo): manage subscription

Same endpoint as web; auth uses `Authorization: Bearer <supabase_access_token>`.

1. **Request:** `POST /api/stripe/create-portal-session` with headers `Authorization` and `Content-Type: application/json`, body `{ "client": "mobile" }`.
2. **Response:** `{ "success": true, "url": "https://billing.stripe.com/..." }` — open `url` in the in-app browser.
3. **`return_url`:** With `client: "mobile"`, Stripe uses `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL` (Customer Portal has a single return URL, unlike Checkout). Configure it in each environment; restart `next dev` after `.env.local` changes.
4. **Prerequisite:** `profiles.stripe_customer_id` must exist (same as web — typically after first successful Checkout). Otherwise the API returns **400** `No billing account found`.
5. **State after return:** Subscription changes are driven by webhooks (`customer.subscription.updated`, etc.). Refetch profile / subscription fields after the portal session closes.

## Mobile app (Expo): Stripe Connect onboarding (payments / Express)

Same **`POST /api/stripe/connect/onboard`** route as web; auth uses `Authorization: Bearer <supabase_access_token>`.

1. **Request:** `POST /api/stripe/connect/onboard` with headers `Authorization` and `Content-Type: application/json`, body `{ "client": "mobile" }`.
2. **Response:** `{ "success": true, "url": "https://connect.stripe.com/..." }` — open `url` in the in-app browser.
3. **Return URLs:** With `client: "mobile"`, Stripe Account Link `return_url` / `refresh_url` come from `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL` and `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` (both required in that environment). Recommended values are:
   - `${SITE}/mobile-bridge/connect-return`
   - `${SITE}/mobile-bridge/connect-refresh`
     These routes are in this repo and log with prefix `[mobile-connect-bridge]`.
4. **After Stripe redirects:** Call **`POST /api/stripe/connect/sync`** with the same Bearer token (empty JSON body is fine). That runs the same Stripe → `payment_accounts` update as web’s `/dashboard/payments?connect=return|refresh`. Then refetch `payment_accounts` from Supabase for UI.

Contract: [`docs/contracts/mobile-stripe-connect-onboarding.md`](../../../../docs/contracts/mobile-stripe-connect-onboarding.md).

### Local development vs production Stripe data

`STRIPE_SECRET_KEY` in `.env.local` is almost always a **test** key (`sk_test_...`), while your Supabase `profiles` row may still hold **live** Stripe IDs (`cus_...`, `sub_...`) from a real production subscription. Stripe will then respond with errors such as **No such customer** when you open the Customer Portal locally. That is expected: test-mode API keys only see test-mode customers.

To exercise billing locally, use a **test** checkout (same Stripe account’s test mode) so webhook writes test IDs into `profiles`, or temporarily point local env at the **live** secret key only on a trusted machine (not recommended). Production deployments that use the matching live key continue to work with production customer IDs.

## Subscription end (cancel flow)

When a user cancels in the Customer Portal, Stripe keeps the subscription active until the end of the current billing period, then sends `customer.subscription.deleted`. The webhook handles this event:

- Finds the profile by `stripe_subscription_id`.
- Sets `subscription_tier = 'free'`, `subscription_status = null`, clears `stripe_subscription_id` and `subscription_current_period_end`. Keeps `stripe_customer_id` so they can resubscribe.

Pro access is computed in code (`isProAccess`): **manual / comped Pro** = `subscription_tier === 'pro'` and **no** `stripe_subscription_id` (always Pro — early adopters). **Paying customers** = row has a `stripe_subscription_id`; then Pro requires Stripe `subscription_status` in `active` or `trialing` (or null/empty status temporarily during sync gaps). Bad statuses (`past_due`, `unpaid`, `canceled`, …) revoke Pro. Access does **not** depend on `subscription_current_period_end` for billed users — Stripe status is the gate (cancel-at-period-end keeps `active` until the subscription actually ends).

## Subscription updated (renewals & status)

When Stripe sends `customer.subscription.updated` (e.g. on renewal, or when status changes to `past_due`/`unpaid` after a failed charge), the webhook:

- Finds the profile by `stripe_subscription_id`.
- Updates `subscription_status` (e.g. `active`, `past_due`, `unpaid`) and `subscription_current_period_end`.
- Sets `subscription_tier` to `pro` when status is `active` or `trialing`, and `free` otherwise—so the database tier matches Stripe even when the subscription still exists (e.g. `past_due`).

This keeps “Pro until …” correct after each billing cycle and lets the app show a “payment failed” banner when status is `past_due` or `unpaid`.

## Payment failed (recurring charge)

When a recurring payment fails (card declined, expired, etc.), Stripe sends `invoice.payment_failed`. The webhook:

- Records the event for idempotency.
- Retrieves the subscription from Stripe and updates `subscription_status` and `subscription_current_period_end` on the profile (same as `customer.subscription.updated`), so failed payments are reflected in the database even if the update event is missed or ordered differently.
- Does **not** send email from ServiceLink for failed charges (avoids mail after cancel, odd retry timing, or overlap with Stripe’s own notifications if enabled).

Stripe will retry automatically. The app also shows an in-app banner on Settings when `subscription_status` is `past_due` or `unpaid`, with an “Update payment method” button that opens the Customer Portal.
