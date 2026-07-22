# Subscription testing notes

## Automated (Playwright)

```bash
npm run test:e2e -- e2e/subscriptions/
```

Uses your **Pro** `E2E_OWNER_*` account. Asserts duplicate checkout is blocked and the billing portal still opens. Does **not** drive Stripe’s hosted Checkout/Portal UI.

See `e2e/subscriptions/README.md`.

## Manual (recommended for full Stripe flows)

Use Stripe **test mode** + test card `4242 4242 4242 4242`.

1. Free → `/dashboard/upgrade` → complete Checkout
2. Pro → try checkout again (should fail / show manage)
3. Settings → Manage subscription → portal (update card / cancel)
4. After cancel settles → resubscribe (should reuse same Stripe customer)

Forward webhooks locally when testing renewals/cancels:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
