# Payments transactions (v1)

Owner activity feed for **money collected**. Product name is **Payments → Transactions**.

Stripe charges, refunds, memberships, and payouts come from the connected account. Cash, payment-app, and other job collections come from `booking_payments` (`session_payment_*` written on `job_completed`). Booking Tap to Pay is Stripe-only so it is not duplicated.

Row `title` is the first service name (no pricing tier, never Mixed/Double jobs). `extraCount` is extra jobs after the first. Payouts are `title: Payout` and `statusLabel: Arrived`.

The header balance is Stripe available / pending only.

Contract: [`docs/contracts/mobile-payments-transactions.md`](../../../../docs/contracts/mobile-payments-transactions.md)

## Sequence

```text
Owner (mobile)
  → GET /api/payments/transactions
       → auth + Pro
       → if Connect complete:
            stripe.balance.retrieve on acct_…
            stripe.balanceTransactions.list (expand source)
            hide stripe_fee rows
            enrich from payment_requests / bookings / tap-to-pay intents
       → load booking_payments session cash / payment_app / other
       → merge by createdAt desc
       → return { balance, items, hasMore, nextCursor }
```

No new table. Stripe is still the card ledger. Offline rows are labeled from the booking (`service_name`, `customer_name`) and method.

## Gates

- Authenticated owner (Bearer or cookie)
- Pro (`getHasProAccessForPayments`)
- Connect is **not** required for offline rows. Missing Connect → `$0.00` balance + cash / payment-app / other only
- Rate limit: 30/min and 180/hour per owner
