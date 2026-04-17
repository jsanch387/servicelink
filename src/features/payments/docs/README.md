# Payments docs

Reference docs for Payments feature schema and flows.

| Doc | Description |
|---|---|
| `DATABASE.md` | Current `payment_accounts` and `payment_settings` schema, constraints, and RLS model. |
| `CONNECT_ONBOARDING.md` | Planned Stripe Connect onboarding behavior and sync strategy. |
| `SUPABASE_SCHEMA_CONTEXT.md` | Broader database snapshot/context for cross-feature planning. |
| `BOOKING_PAYMENTS_TABLE.md` | Planned `booking_payments` table (1:1 booking payment summary). |
| `BOOKING_CHECKOUT_SESSIONS_TABLE.md` | Planned `booking_checkout_sessions` table (Stripe session lifecycle + webhook context). |

Keep these docs updated when schema or payment behavior changes.
