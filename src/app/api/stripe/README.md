# Stripe integration

Checkout for the Pro plan is handled by creating a Stripe Checkout Session and redirecting the user to Stripe. When payment succeeds, the webhook updates the user's profile to Pro.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with `sk_`). From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys). |
| `STRIPE_PRO_PRICE_ID` | Yes | Stripe Price ID for the Pro monthly plan (e.g. `price_xxx`). Create a Product in [Stripe Dashboard → Products](https://dashboard.stripe.com/products), then add a recurring price. |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhook) | Signing secret (starts with `whsec_`). From Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret. |
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

We only store event IDs for event types we actually process (e.g. `checkout.session.completed`). Other events (e.g. `invoice.paid`, `customer.subscription.updated`) are acknowledged with 200 but not stored, so the table stays small. Create this table in Supabase:

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

## Configuring the webhook in Stripe

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://your-domain.com/api/stripe/webhook` (or for local testing use a tunnel like ngrok).
3. Events to send: `checkout.session.completed` (add more later if you handle `customer.subscription.updated` / `customer.subscription.deleted`).
4. Copy the **Signing secret** (`whsec_...`) into your env as `STRIPE_WEBHOOK_SECRET`.

## Customer portal (cancel / manage subscription)

Pro users see a **Manage subscription** button on Settings. It calls `POST /api/stripe/create-portal-session`, which creates a [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal) session and returns the URL. The user is redirected to Stripe’s hosted page where they can update payment method or **cancel subscription**. After they finish, Stripe sends them back to `/dashboard/settings`.

Enable the Customer Portal in Stripe: [Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal). Configure what customers can do (e.g. cancel subscription).

## Next steps (optional)

- **customer.subscription.updated** / **customer.subscription.deleted**: Handle in the webhook to set `subscription_tier = 'free'` and clear Stripe fields when the user cancels.
