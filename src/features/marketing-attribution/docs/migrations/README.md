# Marketing attribution — Supabase migrations

How the pipeline works, ad URL tags, and the SELECT queries to pull
signups / paid conversion: [`../README.md`](../README.md) and [`../queries.sql`](../queries.sql).

**Production safety:** These scripts only **add nullable columns / indexes** and **backfill** `first_paid_at` from existing paid-Pro signals. They do not drop tables.

## Prerequisites

- `public.signup_attribution` and `public.profiles` exist.

## Run order (Supabase SQL Editor)

Run **one file at a time**. Confirm success before the next.

| Order | File                                       | What it does                                       |
| ----- | ------------------------------------------ | -------------------------------------------------- |
| 1     | `001_signup_attribution_first_paid_at.sql` | Nullable `first_paid_at` + indexes + paid backfill |

## After running

1. Verify in Table Editor: `signup_attribution.first_paid_at` exists.
2. Spot-check: paid Pro users with attribution should have a timestamp.
