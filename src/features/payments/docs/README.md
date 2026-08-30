# Payments docs

Reference docs for Payments feature schema and flows.

| Doc                                                                             | Description                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE.md`                                                                   | Current `payment_accounts` and `payment_settings` schema, constraints, and RLS model.                                                                       |
| `CONNECT_ONBOARDING.md`                                                         | Planned Stripe Connect onboarding behavior and sync strategy.                                                                                               |
| **[Connect webhook events](../../../app/api/stripe/CONNECT_WEBHOOK_EVENTS.md)** | **Required Stripe events on `/api/stripe/webhook-connect` (bookings, memberships, payment links, Tap to Pay).**                                             |
| `SUPABASE_SCHEMA_CONTEXT.md`                                                    | Broader database snapshot/context for cross-feature planning.                                                                                               |
| **`BOOKING_CHECKOUT_FLOW.md`**                                                  | **End-to-end availability booking + Stripe Checkout (v1): APIs, webhook, DB, client, emails, and Vitest coverage pointers.**                                |
| `BOOKING_PAYMENTS_TABLE.md`                                                     | `booking_payments` table (1:1 booking payment summary).                                                                                                     |
| `BOOKING_CHECKOUT_SESSIONS_TABLE.md`                                            | `booking_checkout_sessions` table (Stripe session lifecycle + webhook context).                                                                             |
| **`WALKUP_PAYMENT_LINK.md`**                                                    | **Create payment link (v1):** `POST /api/payments/link`, `/p/…`, Checkout on Connect, webhook → `payment_requests`.                                         |
| **`WALKUP_TAP_TO_PAY.md`**                                                      | **Create payment Tap to Pay (v1):** `POST /api/payments/tap-to-pay/intent`, Terminal PI on Connect, webhook → `payment_requests`.                           |
| **`PAYMENTS_TRANSACTIONS.md`**                                                  | **Owner activity feed (v1):** `GET /api/payments/transactions` — Stripe balance + charges/refunds/payouts, plus cash / payment-app / other job collections. |
| **[Revenue](../../../../docs/contracts/mobile-payments-revenue.md)**            | **Completed-job earnings. Same windows, money, and bars as mobile Payments → Revenue.**                                                                     |
| `PAYMENT_REQUESTS_TABLE.md`                                                     | `payment_requests` table (merchant-scoped walk-up charges; not bookings).                                                                                   |
| `sql/001_payment_requests.sql`                                                  | Create `payment_requests` + RLS + indexes. Run in Supabase SQL Editor.                                                                                      |
| `sql/002_payment_requests_short_code.sql`                                       | `short_code` + `stripe_checkout_url` for branded `/p/…` share links.                                                                                        |

Keep these docs updated when schema or payment behavior changes.
