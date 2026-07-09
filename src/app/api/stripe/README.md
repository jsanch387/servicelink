# Stripe integration

Checkout for the Pro plan is handled by creating a Stripe Checkout Session and redirecting the user to Stripe. When payment succeeds, the webhook updates the user's profile to Pro.

**Product summary (pricing strategy, trials, paywall, Free vs Pro):** see [`docs/pricing-strategy-and-model.md`](../../../../docs/pricing-strategy-and-model.md) and the full guide [`docs/subscription-and-pro-features.md`](../../../../docs/subscription-and-pro-features.md).

## Mobile app (iOS) — subscription APIs removed

**As of 2026-05-19**, the ServiceLink iOS app **no longer** calls subscription checkout, onboarding trial, or billing portal APIs. New mobile signups complete onboarding via **`POST /api/onboarding-v2/complete`** (free tier). Plan changes happen on web (`myservicelink.app`). Mobile **still** uses Stripe Connect for merchant payments (`POST /api/stripe/connect/onboard`, `sync`, `express-dashboard`).

Removed / rejected for `client: "mobile"` or Bearer on trial routes:

- `POST /api/stripe/create-checkout-session` with `{ "client": "mobile" }` → **410**
- `POST /api/stripe/create-portal-session` with `{ "client": "mobile" }` → **410**
- `POST /api/stripe/start-onboarding-trial` with Bearer token → **410**
- `POST /api/stripe/confirm-onboarding-trial` — **route removed** (was mobile Checkout follow-up only)

Contract for mobile onboarding: [`docs/contracts/mobile-onboarding-complete.md`](../../../../docs/contracts/mobile-onboarding-complete.md). Connect: [`docs/contracts/mobile-stripe-connect-onboarding.md`](../../../../docs/contracts/mobile-stripe-connect-onboarding.md).

## Environment variables

| Variable                                       | Required                        | Description                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                            | Yes                             | Stripe secret key (starts with `sk_`). From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys).                                                                                                                                                                                                               |
| `STRIPE_PRO_PRICE_ID`                          | Yes                             | Stripe Price ID for **new** Pro monthly signups (e.g. `$20/mo` `price_xxx`). Create a Product in [Stripe Dashboard → Products](https://dashboard.stripe.com/products), then add a recurring price. **Do not** migrate existing subscribers off a legacy price — Stripe keeps them on their current price until they cancel and resubscribe. |
| `STRIPE_PRO_YEARLY_PRICE_ID`                   | Yes for yearly checkout         | Stripe Price ID for **new** Pro yearly signups (e.g. `$200/yr` `price_xxx`) on the same Pro product. Checkout passes `billingInterval: "year"` from `/dashboard/upgrade`.                                                                                                                                                                   |
| `STRIPE_WEBHOOK_SECRET`                        | Yes (for webhook)               | Signing secret (starts with `whsec_`). From Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret.                                                                                                                                                                                                                      |
| `STRIPE_CONNECT_WEBHOOK_SECRET`                | Yes (for Connect webhook)       | Signing secret for `/api/stripe/webhook-connect` destination that listens to **Connected and v2 accounts** events (booking checkout payments).                                                                                                                                                                                              |
| `NEXT_PUBLIC_SITE_URL`                         | No                              | Base URL for success/cancel redirects (e.g. `https://yoursite.com`). Falls back to `VERCEL_URL` or `http://localhost:3000`.                                                                                                                                                                                                                 |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL`  | Yes for Expo Connect onboarding | Stripe Connect **Account Link** `return_url` when `POST /api/stripe/connect/onboard` body includes `client: "mobile"`. Must be **`https://…`** or **`http://…`** (Stripe rejects custom schemes like `myapp://` — use an https bridge page that opens the app).                                                                             |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` | Yes for Expo Connect onboarding | Account Link `refresh_url` (expired link / resume). Same **http(s)** rule as return URL.                                                                                                                                                                                                                                                    |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL`   | Optional                        | Deep link that the bridge route opens for Connect return. Default: `servicelinkmobile://payments/connect?connect=return`.                                                                                                                                                                                                                   |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_REFRESH_URL`  | Optional                        | Deep link that the bridge route opens for Connect refresh. Default: `servicelinkmobile://payments/connect?connect=refresh`.                                                                                                                                                                                                                 |

## Flow (web)

1. User clicks **Get Pro** on `/dashboard/upgrade` (or the plan card links there first).
2. Client calls `POST /api/stripe/create-checkout-session`.
3. API loads `profiles.stripe_customer_id` for the signed-in user, then creates a subscription Checkout Session and returns the session URL (see **One Stripe Customer per profile** below).
4. Client redirects to Stripe Checkout.
5. User completes payment on Stripe.
6. Stripe sends `checkout.session.completed` to `POST /api/stripe/webhook`.
7. Webhook verifies signature, records event id for idempotency, then updates `profiles`: `subscription_tier = 'pro'`, `subscription_status = 'active'`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_current_period_end`.
8. User is redirected to `{SITE_URL}/dashboard/settings?checkout=success`. They now have **unlimited bookings** (the Free plan cap no longer applies).

**Debug:** Verbose **`[stripe:onboarding:…]`** `console.debug` lines are off by default. Set **`DEBUG_STRIPE_ONBOARDING=1`** to enable them. Normal **`[stripe:…]`** `console.info` / `console.warn` / `console.error` lines stay on for success and failure.

## Onboarding step 5 (web) — silent trial (no Checkout redirect)

When **`ONBOARDING_LEGACY_STRIPE_TRIAL`** is enabled, the in-app **Activate my link** button calls **`POST /api/stripe/start-onboarding-trial`** (session cookies only). The server creates a Stripe **Customer** (if needed) and a **Subscription** with **`trial_period_days: 7`** and the same trial end behavior as Checkout (`missing_payment_method: cancel`), then updates `profiles` and completes onboarding. **No Stripe-hosted page** — the user stays in ServiceLink.

Otherwise step 5 uses **`POST /api/onboarding-v2/complete`** (free tier, no Stripe subscription).

## One Stripe Customer per profile (Checkout)

**Problem we fixed:** If Checkout is created with only `customer_email` and no Stripe Customer id, Stripe may create a **new** `cus_…` on every completed session. The same person then appears as **multiple Customers** in the Dashboard (same email, different records). That is confusing for support, looks like “Link vs card” mismatches, and is easy to misread as double billing. Renewals still attach to the **subscription’s** Customer only—but duplicate rows create noise and distrust.

**What we do:** `POST /api/stripe/create-checkout-session` reads `profiles.stripe_customer_id`. When it is set (e.g. after a prior subscription, including after cancel—see **Subscription end**), the session is created with `customer: <stripe_customer_id>` so Stripe **reuses** that Customer. A new subscription after re-upgrade is created **on that same Customer**; the webhook continues to write the new `stripe_subscription_id` and period end from `checkout.session.completed`. When `stripe_customer_id` is still null (first-ever paid signup), the session uses `customer_email` so Stripe creates the Customer on first successful checkout, and the webhook stores the id.

**Operational note:** Legacy accounts may already have duplicate Customers in Stripe from before this behavior. You can leave inactive orphans alone or use Stripe’s tools to merge/delete duplicates; going forward, new checkouts from the app should stay on a single Customer per profile as long as `stripe_customer_id` was saved at least once.

**Out of scope:** Booking payments use Connect Checkout on **connected** accounts (`/api/public/booking-checkout`); that flow is unrelated to platform `profiles.stripe_customer_id` and is unchanged.

## Stripe Tax (Pro subscription checkout)

Dashboard **Tax** settings alone do **not** add tax — Checkout sessions must pass **`automatic_tax: { enabled: true }`** (see `src/libs/stripe/checkoutAutomaticTax.ts`, used by `create-checkout-session` and legacy `start-onboarding-trial`).

### Stripe Dashboard setup

1. **[Settings → Tax](https://dashboard.stripe.com/settings/tax)** — turn on **Stripe Tax**.
2. **Head office address** — your business’s principal / origin address (for a solo founder operating from home, your residence is often correct; confirm with your accountant). Used to preview rates and as your tax origin.
3. **Tax registrations** — add each US state (or country) where you’re **registered to collect** tax. Stripe only charges tax in jurisdictions you register; no registration → no tax line even with automatic tax enabled.
4. **Product / Price** — Pro SaaS price should use an appropriate tax code (Stripe usually defaults digital services when Tax is on).

### At checkout (after code + Dashboard)

- Customer enters **billing address** (Checkout collects it for tax).
- Stripe calculates tax from customer location + your registrations.
- **Total due today** depends on **tax behavior** on the Price (see below).

### Tax inclusive vs exclusive (why total can stay $20)

Stripe Prices have a **tax behavior**:

| Behavior      | What the customer pays        | Example ($20/mo, ~6.2% tax)                        |
| ------------- | ----------------------------- | -------------------------------------------------- |
| **Exclusive** | Subtotal **+ tax on top**     | $20.00 + $1.24 tax = **$21.24 due today**          |
| **Inclusive** | Listed price **includes** tax | **$20.00 due today** ($1.24 is tax inside the $20) |

If Checkout shows **Subtotal $20**, **Sales tax $1.24** in details, but **Total due today $20**, tax is **inclusive** — not broken.

To charge **$20 + tax** (tax added on top), Checkout uses **`tax_behavior: exclusive`** via `buildProSubscriptionCheckoutLineItem` — amount still comes from **`STRIPE_PRO_PRICE_ID`**. You can also set the Price to Exclusive in Dashboard when creating it (optional; code enforces exclusive at checkout).

Product → Price → edit or preview tax often shows “include tax in price” vs “exclude tax from price”.

### Testing

Use **test mode** Checkout with a billing address in a state where you added a registration — you should see a tax line on the Stripe Checkout page. Addresses in non-registered states may show $0 tax.

**Booking Connect checkout** (`/api/public/booking-checkout`) is **not** covered here — that runs on each merchant’s connected account.

## Grandfathering (legacy $10 vs new $20 list price)

- **Marketing / upgrade cards** show **`PLANS.pro.price`** (current list price, e.g. `$20`) for new signups.
- **Existing Stripe subscriptions** stay on whatever **Price** they were created with (e.g. `$10/mo`) until the customer cancels or changes plan in Stripe — no migration required.
- Set **`STRIPE_PRO_PRICE_ID`** to the **new** `$20` price id. Leave the old `$10` price active in Stripe for existing rows; do not bulk-update subscriptions.
- **Settings** and **Your plan** (when already Pro) read the live **`unit_amount`** from Stripe via `getSubscriptionMonthlyPriceDisplay` so grandfathered users see `$10/month`, not the new list price.
- **Resubscribe after cancel** uses Checkout with **`STRIPE_PRO_PRICE_ID`** → new customers and returning churned users pay the current list price.

## Yearly Pro ($200/yr)

Use **one Stripe Product** (your existing Pro product) with **two recurring prices**:

| Price       | Amount  | Interval | Env var                      |
| ----------- | ------- | -------- | ---------------------------- |
| Pro monthly | $20/mo  | Monthly  | `STRIPE_PRO_PRICE_ID`        |
| Pro yearly  | $200/yr | Yearly   | `STRIPE_PRO_YEARLY_PRICE_ID` |

### Stripe Dashboard

1. [Products](https://dashboard.stripe.com/products) → open your **Pro** product (same product as `$20/mo`).
2. **Add another price** → **Recurring** → **Yearly** → **$200.00 USD**.
3. Copy the new `price_…` id into **`STRIPE_PRO_YEARLY_PRICE_ID`** (local `.env.local` and production env).
4. Leave the monthly price active. Do **not** create a separate Product for yearly.

Tax: set the yearly price to **tax exclusive** (same as monthly) if you use Stripe Tax.

### App behavior (already wired)

- `/pricing`, landing, and `/dashboard/upgrade` show a **Monthly / Yearly** toggle.
- Checkout sends `billingInterval: "year"` and uses **`STRIPE_PRO_YEARLY_PRICE_ID`**.
- Webhooks sync **`profiles.subscription_billing_interval`** (`month` or `year`) from the Stripe subscription price.

### Database column

Run once in Supabase SQL editor **before** deploying code that writes this field:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_billing_interval text;

COMMENT ON COLUMN profiles.subscription_billing_interval IS
  'Stripe subscription cadence: month or year. Null when free or no subscription.';
```

Existing Pro subscribers: interval is filled on the next `customer.subscription.updated` webhook, or when they open Settings (we still fall back to live Stripe price data until the column is set).

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

## Pro welcome email (first paid upgrade only)

When a user reaches a **paid, active** Pro subscription for the **first time**, the webhook sends a one-time "Welcome to Pro" email (links to the Meta ads workshop). It fires from `checkout.session.completed` (direct paid checkout) and from `customer.subscription.updated` (trial → paid conversion), via `sendProWelcomeIfFirstPaidPro`.

Once-only is enforced by an **atomic claim** on `profiles.pro_welcome_email_sent_at`: the timestamp is set only where it is still `NULL`. Renewals, status changes, and cancel → resubscribe (we always keep `stripe_customer_id`) can never re-send because the column is never cleared on downgrade. A send failure releases the claim so a later event can retry.

Add the column and **backfill existing Pro users** so only future first-time upgrades get the email:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pro_welcome_email_sent_at timestamptz;

-- Suppress the email for everyone who is already Pro today.
UPDATE profiles
  SET pro_welcome_email_sent_at = now()
  WHERE pro_welcome_email_sent_at IS NULL
    AND subscription_tier = 'pro';
```

## Payment failed email (once per failure episode)

When a recurring charge fails, the webhook (`invoice.payment_failed`) now sends a single "your payment failed" email to the owner via `notifyPaymentFailedOnce` → `sendSubscriptionPaymentFailedEmail`. Stripe fires `invoice.payment_failed` on **every** retry attempt, so the email is guarded by an **atomic claim** on `profiles.payment_failed_email_sent_at`: it's set only where still `NULL`, so retries of the same failure can't re-send.

The flag is **cleared when the subscription recovers** to an active/granting state (`syncProfileFromSubscriptionUpdated`, `updateProfileFromCheckout`), so a later, separate failure can notify the owner again.

Add the column (no backfill — currently-failing users will get one heads-up on their next retry):

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_failed_email_sent_at timestamptz;
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

## Customer portal (cancel / manage subscription) — web

Pro users see a **Manage subscription** button on Settings. It calls `POST /api/stripe/create-portal-session`, which creates a [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal) session and returns the URL. The user is redirected to Stripe’s hosted page where they can update payment method or **cancel subscription**. After they finish, Stripe sends them back to `/dashboard/settings`.

Enable the Customer Portal in Stripe: [Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal). Configure what customers can do (e.g. cancel subscription).

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

### Mobile app (Expo): Stripe Express Dashboard (connected account)

After Connect onboarding is complete, the owner can open their **connected account** dashboard (balance, payouts, tax forms) via the same route as web.

1. **Request:** `POST /api/stripe/connect/express-dashboard` with `Authorization: Bearer <supabase_access_token>`, `Content-Type: application/json`, and body `{}` or `{ "client": "mobile" }` (optional; same as other Stripe routes, no extra env vars).
2. **Response:** `{ "success": true, "url": "https://connect.stripe.com/..." }` — open `url` in the in-app browser. Stripe **Login Links** do not take a `return_url`; when the user finishes, close the browser or deep-link back in your app.
3. **Prerequisites:** Pro subscription, current business resolved, and a `payment_accounts.stripe_account_id` for that business (otherwise **404** `No Stripe account linked…`).

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
- Sends **one** ServiceLink "payment failed" email per failure episode via `notifyPaymentFailedOnce` (see **Payment failed email** above). Keep Stripe's own failed-payment customer email **off** to avoid duplicates — we send our on-brand one instead.

Stripe will retry automatically. The app also shows an in-app banner on Settings when `subscription_status` is `past_due` or `unpaid`, with an “Update payment method” button that opens the Customer Portal.
