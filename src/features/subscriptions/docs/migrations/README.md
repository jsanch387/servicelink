# Memberships — Supabase migrations

**Naming:** DB tables use `membership_*` / `customer_memberships` so they never collide with Pro SaaS fields on `profiles`. Dashboard UI can still say "Subscriptions."

**Feature docs:** [../README.md](../README.md) · [../DATABASE.md](../DATABASE.md) · [../FLOWS.md](../FLOWS.md)

**Production safety:** These scripts only **create** tables (plus `004` drops unused settings). They do not alter unrelated tables.

## Prerequisites

- `public.business_profiles` exists.
- `public.customers` exists (nullable FK from `customer_memberships`).
- `public.set_updated_at()` trigger function exists.
- Phase 1 plan tables already applied (`membership_plans`, `membership_plan_prices`).

## Run order (Supabase SQL Editor)

Run **one file at a time**. Confirm success before the next.

| Order | File                                | What it does                                             |
| ----- | ----------------------------------- | -------------------------------------------------------- |
| 1     | `001_membership_plans.sql`          | Plan catalog + RLS _(phase 1 — already applied in prod)_ |
| 2     | `002_membership_plan_prices.sql`    | Cadence prices + RLS _(phase 1)_                         |
| 3     | `003_membership_settings.sql`       | _(obsolete)_ skip if not applied; drop via `004`         |
| 4     | `004_drop_membership_settings.sql`  | Remove settings table if you ran `003`                   |
| 5     | `005_customer_memberships.sql`      | Live subscribers (Stripe Subscription state)             |
| 6     | `006_membership_events.sql`         | Append-only lifecycle timeline                           |
| 7     | `007_membership_invoices.sql`       | Invoice / payment ledger                                 |
| 8     | `008_membership_payment_method.sql` | Card brand / last4 on `customer_memberships` _(applied)_ |

## Phase 2 RLS model

| Table                  | `authenticated` (owner) | `service_role` (webhooks) |
| ---------------------- | ----------------------- | ------------------------- |
| `customer_memberships` | **SELECT** only         | ALL                       |
| `membership_events`    | **SELECT** only         | ALL                       |
| `membership_invoices`  | **SELECT** only         | ALL                       |

No anon/public policies. Public checkout does not write these tables until the Connect webhook runs with the admin/service client.

## After running phase 2

1. Table Editor: three new tables exist.
2. As owner: `select * from customer_memberships` returns only your business (empty until webhook).
3. Confirm you cannot `insert` as the logged-in owner (should fail RLS).
4. Update [../DATABASE.md](../DATABASE.md) when columns change.

## Rollback phase 2 only (no production member data yet)

```sql
drop table if exists public.membership_invoices;
drop table if exists public.membership_events;
drop table if exists public.customer_memberships;
```

## Rollback everything (only if no production data)

```sql
drop table if exists public.membership_invoices;
drop table if exists public.membership_events;
drop table if exists public.customer_memberships;
drop table if exists public.membership_plan_prices;
drop table if exists public.membership_plans;
drop table if exists public.membership_settings;
```
