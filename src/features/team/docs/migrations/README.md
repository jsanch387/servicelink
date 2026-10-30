# Team — Supabase migrations

Run in the SQL Editor on the project, in order. Scripts are idempotent.

| File                                                                           | What it does                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| [`001_business_members.sql`](./001_business_members.sql)                       | Members-only table, reject-owner trigger, SELECT RLS          |
| [`002_team_invites.sql`](./002_team_invites.sql)                               | Pending invite emails + hashed accept links                   |
| [`003_member_work_select.sql`](./003_member_work_select.sql)                   | Active member SELECT on shop work tables                      |
| [`004_booking_assignee.sql`](./004_booking_assignee.sql)                       | Optional `bookings.assigned_user_id` (owner or active member) |
| [`005_member_office_select_revoke.sql`](./005_member_office_select_revoke.sql) | Drop member SELECT on customers, quotes, reviews              |
| [`006_team_invites_name.sql`](./006_team_invites_name.sql)                     | Owner-typed `team_invites.name` (shop-facing label)           |
| [`007_team_plan_grandfather.sql`](./007_team_plan_grandfather.sql)             | `team_included` snapshot and `profiles.subscription_plan`     |
| [`008_team_roles.sql`](./008_team_roles.sql)                                   | `team_invites.role` and allowed hired roles                   |
| [`009_booking_created_by.sql`](./009_booking_created_by.sql)                   | `bookings.created_by_user_id` for staff-created appointments  |

The account owner is **not** backfilled. They stay on `business_profiles.profile_id`.
