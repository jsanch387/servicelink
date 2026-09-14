# Team — Supabase migrations

Run in the SQL Editor on the project, in order. Scripts are idempotent.

| File | What it does |
| ---- | ------------ |
| [`001_business_members.sql`](./001_business_members.sql) | Members-only table, reject-owner trigger, SELECT RLS |
| [`002_team_invites.sql`](./002_team_invites.sql) | Pending invite emails + hashed accept links |
| [`003_member_work_select.sql`](./003_member_work_select.sql) | Active member SELECT on shop work tables |

The account owner is **not** backfilled. They stay on `business_profiles.profile_id`.
