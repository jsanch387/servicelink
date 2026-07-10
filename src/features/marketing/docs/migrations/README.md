# Marketing — Supabase migrations

**Production safety:** These scripts only **create new tables** and **add nullable columns** to `bookings`. They do **not** update, delete, or backfill existing data.

## Prerequisites

- `public.business_profiles` and `public.bookings` exist.
- `public.set_updated_at()` trigger function exists (used by quotes/reviews).

## Run order (Supabase SQL Editor)

Run **one file at a time**. Confirm success before the next.

| Order | File                                | What it does                                |
| ----- | ----------------------------------- | ------------------------------------------- |
| 1     | `001_promo_codes.sql`               | Table + RLS + indexes                       |
| 2     | `002_sales.sql`                     | Table + RLS + one-active-sale index         |
| 3     | `003_promo_code_redemptions.sql`    | Table + RLS (owner SELECT only)             |
| 4     | `004_bookings_discount_columns.sql` | Nullable discount columns on `bookings`     |
| 5     | `005_sales_optional_dates.sql`      | Nullable `starts_at` / `ends_at` on `sales` |

## After running

1. Verify in Table Editor: `promo_codes`, `sales`, `promo_code_redemptions` exist; `bookings` has new columns.
2. Spot-check RLS: as owner, `select * from promo_codes` should return only your rows.
3. Update `src/libs/supabase/client.ts` types when wiring the app (Phase 1).

## Rollback (only if no production data yet)

If you need to undo **before any app writes**:

```sql
-- Danger: only if tables are empty and feature not live
alter table public.bookings
  drop column if exists discount_source,
  drop column if exists discount_promo_code_id,
  drop column if exists discount_sale_id,
  drop column if exists discount_type,
  drop column if exists discount_value,
  drop column if exists subtotal_cents,
  drop column if exists discount_cents,
  drop column if exists discount_label;

drop table if exists public.promo_code_redemptions;
drop table if exists public.sales;
drop table if exists public.promo_codes;
```

Do **not** run rollback if redemptions or discount snapshots exist in production.

## RLS summary

| Table                    | `authenticated` (owner)          | `service_role`             |
| ------------------------ | -------------------------------- | -------------------------- |
| `promo_codes`            | SELECT, INSERT, UPDATE, DELETE   | ALL                        |
| `sales`                  | SELECT, INSERT, UPDATE, DELETE   | ALL                        |
| `promo_code_redemptions` | SELECT only                      | INSERT at completion (API) |
| `bookings` (new cols)    | Unchanged — existing booking RLS |

Public promo validation uses **service role** in API routes (no anon SELECT on marketing tables).
