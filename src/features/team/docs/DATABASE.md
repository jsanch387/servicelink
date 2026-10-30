# Team — database

How the product behaves: [`TEAM_FEATURE.md`](./TEAM_FEATURE.md).

The owner is `business_profiles.profile_id`. People they hire are `business_members`. Invites are `team_invites`. Permissions are not rows. The app reads `business_members.role` and checks `ROLE_PERMISSIONS`.

```
business_profiles.profile_id  →  owner (billing, invites, settings)
business_members              →  hired people (member, coordinator, manager)
team_invites                  →  one invite row per shop + email
bookings.assigned_user_id     →  who the job is labeled for
bookings.created_by_user_id   →  who created the appointment
```

SQL files that still live in this repo are listed in [`migrations/README.md`](./migrations/README.md). Roles, the invite name, the assignee, who created the appointment, and manager office access are already on the production database. This file describes that current shape.

---

## How a request is allowed

Two checks, in this order.

1. **App.** The API resolves the shop (owned profile, then an active membership) and calls `can(ctx, permission)`. A failed check returns 403 before any write. The owner passes every check.
2. **Database.** If the signed-in session reads or writes a table directly, row security still applies. The service role skips row security. Booking create, reschedule, cancel, and delete use the service role only after the permission check, and only for that shop.

A hire never becomes the owner by a failed lookup. If the shop cannot be resolved, the sidebar gets no permissions.

---

## `business_members`

The owner is not in this table. A trigger rejects inserting the shop's `profile_id` as a member.

| Column        | Notes                                                   |
| ------------- | ------------------------------------------------------- |
| `id`          | uuid primary key                                        |
| `business_id` | → `business_profiles(id)`                               |
| `user_id`     | → `auth.users(id)`                                      |
| `role`        | `member` (default), `coordinator`, or `manager`         |
| `status`      | `active` or `removed`. Only `active` can open the shop. |
| `created_at`  |                                                         |
| `updated_at`  |                                                         |

One active membership per user. Unique `(business_id, user_id)`.

Authenticated clients can SELECT their own row, and the owner can SELECT every row on their shop. Inserts and updates go through the service role (accept, remove, change role).

Changing an active person's role updates this `role`. It also updates the accepted `team_invites.role` for that person, so a later rejoin does not put the old role back.

---

## `team_invites`

A membership row is created only after accept.

| Column             | Notes                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `id`               | uuid primary key                                                                           |
| `business_id`      | → `business_profiles(id)`                                                                  |
| `email`            | Normalized lowercase                                                                       |
| `name`             | Owner-typed label. Kept after accept. Used on Team and assignee chips.                     |
| `role`             | `member` (default), `coordinator`, or `manager`. Copied onto `business_members` at accept. |
| `link_token_hash`  | SHA-256 of the raw URL token. The raw token is not stored.                                 |
| `status`           | `pending`, `accepted`, `revoked`, or `expired`                                             |
| `invited_by`       | Owner user id                                                                              |
| `accepted_user_id` | Set on accept                                                                              |
| `expires_at`       | 14 days from send                                                                          |

One invite row per shop and email. A resend or a re-invite after removal reopens that row. It does not insert a second one.

The owner can SELECT their shop's invites. Writes go through the service role.

---

## Who can read which rows

### Any active hire

`auth_is_active_business_member(business_id)` is true when the signed-in user has an **active** membership on that shop. The role does not matter. Member, coordinator, and manager all match.

That helper allows SELECT on the job board and the shop rows needed to render it:

- `bookings`, `booking_requests`
- `business_profiles`, `business_availability`, `business_services`, `business_images`, `business_service_areas`
- `maintenance_enrollments`, `public_analytics_events`

It does **not** allow SELECT on customers, quotes, reviews, invoices, or expenses. Those member policies were removed.

### Manager only

`auth_is_active_shop_manager(business_id)` is true when that membership is active **and** `role = 'manager'`. Member and coordinator do not match.

That helper is what lets a manager open the office with their own session:

- Customers, quotes, quote links, quote events
- Invoices and invoice line items (SELECT)
- Expenses, reviews, review invites
- Services, add-ons, categories, price options, images, service areas, availability
- Promo codes, sales, and the booking profile update

Members and coordinators have no policies on those office tables, so a direct read returns nothing.

### Owner only in the database

These stay on the owner session. There is no manager policy.

- `payment_settings`
- `booking_payments`
- `booking_invoices`
- Membership plans, prices, subscribers, and membership invoices

Payment settings, Stripe Connect, and membership plans also require `payments.manage` or `billing.manage` in the API. A hire is refused before those routes talk to Stripe.

Invoice **writes** (create, send, void, mark paid) use the service role after `invoices.write`. Invoice **list and PDF** use the signed-in session, which is why the manager SELECT policy exists. The public invoice page does not use the hire's session.

---

## Booking columns

| Column               | Notes                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `assigned_user_id`   | Owner or an active member, or null. Not a `business_members` id. Removing a hire clears upcoming confirmed jobs only.                            |
| `created_by_user_id` | Signed-in user who created the appointment. Null for customer and system bookings. Not cleared when a hire is removed. Not shown in the product. |

The assignee trigger rejects anyone who is not the shop owner or an active member of that shop.

---

## What this repo still has as SQL

[`migrations/`](./migrations/README.md) has the invite table, member SELECT for the job board, and the script that drops member SELECT on customers, quotes, and reviews.

Do not treat a missing file in that folder as a missing production rule. The live database already has the role values, manager policies, and invoice manager SELECT described above.
