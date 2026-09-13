# Team — database (v1)

Teammates the **owner adds**. The person who created the account is **not** in this table.

**SQL:** [`migrations/001_business_members.sql`](./migrations/001_business_members.sql) — run in the Supabase SQL Editor.

---

## Rule

```
business_profiles.profile_id  →  account owner (billing, invites, settings)
business_members              →  people they add (log in and run the shop)
```

One **active** membership per user (v1: a teammate belongs to one shop).

`resolveCurrentBusinessId` uses **owned shop first**, then an active `business_members` row.

---

## `business_members`

| Column        | Type        | Notes                                       |
| ------------- | ----------- | ------------------------------------------- |
| `id`          | uuid PK     | `gen_random_uuid()`                         |
| `business_id` | uuid FK     | → `business_profiles(id)` ON DELETE CASCADE |
| `user_id`     | uuid FK     | → `auth.users(id)` ON DELETE CASCADE        |
| `role`        | text        | `member` (default). Hired admin later.      |
| `status`      | text        | `active` \| `removed`                       |
| `created_at`  | timestamptz | `now()`                                     |
| `updated_at`  | timestamptz | `public.set_updated_at()`                   |

**Constraints**

- Unique `(business_id, user_id)`
- One **active** row per `user_id`
- Trigger rejects inserting the shop’s `profile_id` (owner) as a member

**Writes:** authenticated clients are **SELECT only**. Adding/removing members will use the service role later.

**RLS (authenticated)**

| Policy                          | Access                                           |
| ------------------------------- | ------------------------------------------------ |
| `business_members_self_select`  | Own rows (`user_id = auth.uid()`)                |
| `business_members_owner_select` | All rows on a shop they own (`profile_id = uid`) |

---

## Not in this migration

- Invite tokens / email
- Job assignees
- Team plan / seat count
- Member access to bookings and other tables (still owner RLS)
