# Payments docs

Reference docs for Payments feature schema and flows.

| Doc                                  | Description                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE.md`                        | Current `payment_accounts` and `payment_settings` schema, constraints, and RLS model.                                        |
| `CONNECT_ONBOARDING.md`              | Planned Stripe Connect onboarding behavior and sync strategy.                                                                |
| `SUPABASE_SCHEMA_CONTEXT.md`         | Broader database snapshot/context for cross-feature planning.                                                                |
| **`BOOKING_CHECKOUT_FLOW.md`**       | **End-to-end availability booking + Stripe Checkout (v1): APIs, webhook, DB, client, emails, and Vitest coverage pointers.** |
| `BOOKING_PAYMENTS_TABLE.md`          | `booking_payments` table (1:1 booking payment summary).                                                                      |
| `BOOKING_CHECKOUT_SESSIONS_TABLE.md` | `booking_checkout_sessions` table (Stripe session lifecycle + webhook context).                                              |

Keep these docs updated when schema or payment behavior changes.
