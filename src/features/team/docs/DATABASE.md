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

## `team_invites`

Pending email invites. A `business_members` row is created only after they accept.

**SQL:** [`migrations/002_team_invites.sql`](./migrations/002_team_invites.sql)

| Column             | Type        | Notes                                       |
| ------------------ | ----------- | ------------------------------------------- |
| `id`               | uuid PK     | `gen_random_uuid()`                         |
| `business_id`      | uuid FK     | → `business_profiles(id)` ON DELETE CASCADE |
| `email`            | text        | Normalized lowercase                        |
| `link_token_hash`  | text unique | SHA-256 of the raw URL token                |
| `status`           | text        | `pending` \| `accepted` \| `revoked` \| `expired` |
| `invited_by`       | uuid FK     | Owner `auth.users` id                       |
| `accepted_user_id` | uuid FK     | Set on accept                               |
| `expires_at`       | timestamptz | 14 days from send                           |

**Writes:** service role. Authenticated owners can SELECT their shop’s rows.

---

## Member SELECT (work tables)

**SQL:** [`migrations/003_member_work_select.sql`](./migrations/003_member_work_select.sql)

`auth_is_active_business_member(business_id)` is true when the signed-in user
has an **active** `business_members` row. SELECT-only policies use that helper
on bookings, booking requests, customers, quotes, reviews, and the shop rows
needed to render those pages. Writes stay owner-only.

---

## Not in this migration

- Job assignees
- Team plan / seat count
- Member writes (status updates, send quote, etc.)
