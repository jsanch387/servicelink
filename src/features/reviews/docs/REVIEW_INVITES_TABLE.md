# `review_invites` table

One-time customer link per booking. Part of the reviews database — see **[DATABASE.md](./DATABASE.md)** for full flows and diagrams.

Published feedback lives in [`REVIEWS_TABLE.md](./REVIEWS_TABLE.md).

---

## Purpose

- One **invite row per booking** (`booking_id` unique) when the visit is eligible.
- **Do not create** a new invite if the customer already has a review or a pending invite for this business (see [DATABASE.md](./DATABASE.md)).
- Stores **hashed** link token only; raw token exists only in the delivered link (SMS or email).
- Tracks lifecycle (`pending` → `submitted` / `expired` / `cancelled`) and delivery (SMS and/or email).
- Delivery is **SMS-first** (review link texted) with an **email fallback** — never both.

---

## Relationship

```text
business_profiles
  └─ review_invites (business_id)
       ├─ bookings (booking_id) UNIQUE
       └─ customers (customer_id, optional)
            └─ reviews (after submit, via review_invite_id)
```

---

## Schema

Table: `public.review_invites`

| Column                    | Type        | Nullable | Default             | Notes                                               |
| ------------------------- | ----------- | -------- | ------------------- | --------------------------------------------------- |
| `id`                      | uuid        | no       | `gen_random_uuid()` | PK                                                  |
| `business_id`             | uuid        | no       | —                   | FK → `business_profiles(id)` ON DELETE CASCADE      |
| `booking_id`              | uuid        | no       | —                   | FK → `bookings(id)` ON DELETE CASCADE, **unique**   |
| `customer_id`             | uuid        | yes      | —                   | FK → `customers(id)` ON DELETE SET NULL             |
| `link_token_hash`         | text        | no       | —                   | 64-char SHA-256 hex, **unique**                     |
| `status`                  | text        | no       | `'pending'`         | See status enum below                               |
| `expires_at`              | timestamptz | no       | —                   | App sets e.g. `now() + 90 days`                     |
| `submitted_at`            | timestamptz | yes      | —                   | Required when `status = submitted`                  |
| `sms_sent_at`             | timestamptz | yes      | —                   | Successful invite SMS (review link) — migration 004 |
| `email_sent_at`           | timestamptz | yes      | —                   | Successful invite email (fallback)                  |
| `last_notification_error` | text        | yes      | —                   | Last delivery failure message                       |
| `created_at`              | timestamptz | no       | `now()`             |                                                     |
| `updated_at`              | timestamptz | no       | `now()`             | Trigger-maintained                                  |

### Status values

| Value       | `submitted_at` | Typical meaning              |
| ----------- | -------------- | ---------------------------- |
| `pending`   | null           | Awaiting customer submit     |
| `submitted` | set            | Customer posted review       |
| `expired`   | null           | Link no longer valid         |
| `cancelled` | null           | Invite voided without review |

---

## Constraints

- `review_invites_status_check` — status in allowed set
- `review_invites_submitted_consistency_check` — `submitted` ↔ `submitted_at` aligned
- `review_invites_link_token_hash_format_check` — `^[a-f0-9]{64}$`
- Trigger `review_invites_enforce_booking_business` — `booking.business_id = invite.business_id`

---

## Indexes

| Index                                          | Type                               | Purpose                         |
| ---------------------------------------------- | ---------------------------------- | ------------------------------- |
| `review_invites_booking_id_key`                | unique                             | One invite per booking          |
| `review_invites_link_token_hash_key`           | unique                             | Token lookup                    |
| `review_invites_business_id_created_at_idx`    | btree                              | Lists by business               |
| `review_invites_expires_at_idx`                | partial (`pending`)                | Expiry jobs                     |
| `review_invites_business_customer_pending_key` | partial (`pending`, migration 003) | One pending invite per customer |

---

## RLS

| Operation | `authenticated`   | `anon` | `service_role` |
| --------- | ----------------- | ------ | -------------- |
| SELECT    | Own `business_id` | denied | allowed        |
| INSERT    | denied            | denied | allowed        |
| UPDATE    | denied            | denied | allowed        |
| DELETE    | denied            | denied | allowed        |

Policy: `review_invites_owner_select`

Public token routes must use **service role** server-side (no anon policies).

---

## Migration

[`migrations/001_review_invites.sql`](./migrations/001_review_invites.sql)

Run **before** `002_reviews.sql`.

Later: [`migrations/004_review_invites_sms_sent_at.sql`](./migrations/004_review_invites_sms_sent_at.sql) adds `sms_sent_at` for SMS-first delivery.

---

## App wiring (planned)

1. Booking **completed** → if eligible, insert row and deliver `/review/{rawToken}` **SMS-first** (text), falling back to email when there's no phone or the SMS fails.
2. `GET /review/[token]` → hash token, load pending non-expired invite.
3. Submit → insert `reviews`, update invite to `submitted`.
4. Later completed visits for same `customer_id` → no new invite (customer already reviewed).
