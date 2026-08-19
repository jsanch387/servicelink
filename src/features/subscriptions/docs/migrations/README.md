# Memberships — Supabase migrations

**Naming:** DB tables use `membership_*` / `customer_memberships` so they never collide with Pro SaaS fields on `profiles`. Dashboard UI says "Subscriptions."

**Feature docs:** [../README.md](../README.md) · [../DATABASE.md](../DATABASE.md) · [../FLOWS.md](../FLOWS.md)

Phase 1–2 table SQL (001–011, 013) is **already applied** in production. This folder keeps leftover / follow-up scripts.

## In this folder

| File                                         | What it does                                                    |
| -------------------------------------------- | --------------------------------------------------------------- |
| `012_booking_payments_membership_method.sql` | Allow `booking_payments.payment_method_selected = 'membership'` |

## RLS model (live)

| Table                               | `authenticated` (owner)            | `service_role` |
| ----------------------------------- | ---------------------------------- | -------------- |
| `membership_plans` / `_plan_prices` | SELECT + writes via owner policies | ALL            |
| `customer_memberships`              | **SELECT** only                    | ALL            |
| `membership_events`                 | **SELECT** only                    | ALL            |
| `membership_invoices`               | **SELECT** only                    | ALL            |

No anon policies on member tables. Public checkout does not write them; the Connect webhook uses the admin client.

Do **not** drop `customer_memberships` in production — there is live subscriber data.
