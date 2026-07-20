# Subscription E2E (guards only)

Full Stripe Checkout and Customer Portal journeys are **manual** (test mode + test cards).

These Playwright tests only check that a **Pro** E2E owner cannot open a second subscription checkout, and can still open the billing portal.

## Run

```bash
# Dev server on :3000 (or let Playwright start it)
npm run test:e2e -- e2e/subscriptions/
```

## Requirements

`.env.e2e.local` with a **Pro (active)** owner:

```bash
E2E_OWNER_EMAIL=...
E2E_OWNER_PASSWORD=...
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

App `.env.local` must use **Stripe test** keys (`sk_test_…`).

## What is covered

- `POST /api/stripe/create-checkout-session` → `DUPLICATE_SUBSCRIPTION_BLOCKED` (month + year)
- `POST /api/stripe/create-portal-session` → Stripe portal URL
- Active Pro visiting `/dashboard/upgrade` is redirected to `/dashboard` (no Get Pro)

## Manual checklist (test mode)

- [ ] New Free user → Upgrade → Checkout → `4242…` → Pro in Settings
- [ ] Cancel in portal → after period ends / delete → can resubscribe (same customer)
- [ ] Payment fail → Settings “Update payment method” → portal
- [ ] Confirm Stripe Dashboard: one customer, one active subscription
