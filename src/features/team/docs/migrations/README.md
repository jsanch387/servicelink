# Team — Supabase migrations

Run in the SQL Editor on the project, in order. Scripts are idempotent.

| File | What it does |
| ---- | ------------ |
| [`001_business_members.sql`](./001_business_members.sql) | Members-only table, reject-owner trigger, SELECT RLS |

The account owner is **not** backfilled. They stay on `business_profiles.profile_id`.
