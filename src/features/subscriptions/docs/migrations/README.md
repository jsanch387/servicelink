# Memberships — Supabase migrations (phase 1)

**Naming:** DB tables use `membership_*` so they never collide with Pro SaaS fields on `profiles` (`subscription_tier`, `stripe_subscription_id`, etc.). Dashboard UI can still say "Subscriptions."

**Feature docs:** [../README.md](../README.md) · [../DATABASE.md](../DATABASE.md) · [../FLOWS.md](../FLOWS.md)

**Production safety:** Create scripts only add tables. `004` drops the unused settings table.

## Prerequisites

- `public.business_profiles` exists.
- `public.set_updated_at()` trigger function exists (used by quotes/reviews).

## Run order (Supabase SQL Editor)

Run **one file at a time**. Confirm success before the next.

| Order | File | What it does |
| ----- | ---- | ------------ |
| 1 | `001_membership_plans.sql` | Plan catalog + RLS |
| 2 | `002_membership_plan_prices.sql` | Cadence prices + RLS |
| 3 | `003_membership_settings.sql` | _(obsolete)_ skip if not applied; drop via `004` |
| 4 | `004_drop_membership_settings.sql` | Remove settings table if you ran `003` |

**UI after gates are ready:** 0 plans → create first plan. ≥1 plan → list. No opt-in flag.

## After running

1. Table Editor: `membership_plans`, `membership_plan_prices` exist; `membership_settings` does not.
2. Spot-check RLS as the business owner: `select * from membership_plans` returns only your business rows.
3. Keep [../DATABASE.md](../DATABASE.md) aligned with live columns.

## Rollback (only if no production data yet)

```sql
drop table if exists public.membership_plan_prices;
drop table if exists public.membership_plans;
drop table if exists public.membership_settings;
```
