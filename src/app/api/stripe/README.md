# Stripe integration

Checkout for the Pro plan is handled by creating a Stripe Checkout Session and redirecting the user to Stripe. When payment succeeds, the webhook updates the user's profile to Pro.

**Product summary (who gets Pro, what features are paywalled):** see [`docs/subscription-and-pro-features.md`](../../../../docs/subscription-and-pro-features.md) at the repo root.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with `sk_`). From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys). |
| `STRIPE_PRO_PRICE_ID` | Yes | Stripe Price ID for the Pro monthly plan (e.g. `price_xxx`). Create a Product in [Stripe Dashboard → Products](https://dashboard.stripe.com/products), then add a recurring price. |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhook) | Signing secret (starts with `whsec_`). From Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret. |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Yes (for Connect webhook) | Signing secret for `/api/stripe/webhook-connect` destination that listens to **Connected and v2 accounts** events (booking checkout payments). |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL for success/cancel redirects (e.g. `https://yoursite.com`). Falls back to `VERCEL_URL` or `http://localhost:3000`. |

## Flow

1. User clicks **Get Pro** on `/dashboard/upgrade` (or the plan card links there first).
2. Client calls `POST /api/stripe/create-checkout-session`.
3. API creates a subscription Checkout Session and returns the session URL.
4. Client redirects to Stripe Checkout.
5. User completes payment on Stripe.
6. Stripe sends `checkout.session.completed` to `POST /api/stripe/webhook`.
7. Webhook verifies signature, records event id for idempotency, then updates `profiles`: `subscription_tier = 'pro'`, `subscription_status = 'active'`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_current_period_end`.
8. User is redirected to `{SITE_URL}/dashboard/settings?checkout=success`. They now have unlimited bookings (no monthly cap).

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
