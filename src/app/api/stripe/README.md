# Stripe integration

Checkout for the Pro plan is handled by creating a Stripe Checkout Session and redirecting the user to Stripe.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with `sk_`). From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys). |
| `STRIPE_PRO_PRICE_ID` | Yes | Stripe Price ID for the Pro monthly plan (e.g. `price_xxx`). Create a Product in [Stripe Dashboard → Products](https://dashboard.stripe.com/products), then add a recurring price. |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL for success/cancel redirects (e.g. `https://yoursite.com`). Falls back to `VERCEL_URL` or `http://localhost:3000`. |

## Flow

1. User clicks **Get Pro** on `/dashboard/upgrade` (or the plan card links there first).
2. Client calls `POST /api/stripe/create-checkout-session`.
3. API creates a subscription Checkout Session and returns the session URL.
4. Client redirects to Stripe Checkout.
5. After payment, Stripe redirects to `{SITE_URL}/dashboard/settings?checkout=success` (or cancel URL back to upgrade page).

## Next steps (not implemented)

- **Webhook**: Handle `checkout.session.completed` (and optionally `customer.subscription.deleted`) to update subscription state in your DB.
- **Customer portal**: Optional link for users to manage subscription or cancel from Settings.
