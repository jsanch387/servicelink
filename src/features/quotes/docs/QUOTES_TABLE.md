# Quotes table (owner-created quote flow)

This doc describes the current **`quotes`** table used by dashboard quote creation (`New Quote`), including schema shape, RLS, indexes, and operational considerations.
Scope here is **quotes table only** (no public link table yet).

---

## Purpose

`quotes` stores a quote as a **separate lifecycle entity** from `bookings`.

- Quote can be drafted/sent/viewed/approved/declined.
- Quote is **not** a booking by default.
- On future approval flow, quote can be converted into booking (`booking_id` set).

---

## Why separate from `bookings`

- Keeps quote lifecycle states out of appointment records.
- Preserves quote history and customer decision trail.
- Allows secure public quote links and review actions later.
- Makes conversion to booking explicit and auditable.

---

## Source-of-truth relationship

`business_profiles` is the root entity.
`quotes.business_id -> business_profiles.id ON DELETE CASCADE`.

If a business profile is deleted, its quotes are deleted automatically.

---

## Status lifecycle (current)

Enum: `public.quote_status`

- `draft`
- `sent`
- `viewed`
- `approved`
- `declined`
- `expired`
- `cancelled`

Recommended practical transitions:

- `draft -> sent`
- `sent -> viewed`
- `sent/viewed -> approved | declined | expired | cancelled`
- `approved -> (future) booking conversion with booking_id`

---

## Schema summary

Table: `public.quotes`

| Column                 | Type                  | Nullable | Notes                                             |
| ---------------------- | --------------------- | -------: | ------------------------------------------------- |
| `id`                   | uuid                  |       no | PK, default `gen_random_uuid()`                   |
| `business_id`          | uuid                  |       no | FK -> `business_profiles(id)` `ON DELETE CASCADE` |
| `created_by_user_id`   | uuid                  |       no | Owner user id at create time                      |
| `customer_name`        | text                  |       no | Snapshot                                          |
| `customer_email`       | text                  |       no | Snapshot, format check                            |
| `customer_phone`       | text                  |      yes | Snapshot                                          |
| `service_name`         | text                  |       no | Snapshot                                          |
| `price_cents`          | integer               |       no | `>= 0`                                            |
| `duration_minutes`     | integer               |       no | `> 0`                                             |
| `note`                 | text                  |      yes | Optional                                          |
| `scheduled_date`       | date                  |       no | Owner-selected schedule snapshot                  |
| `scheduled_start_time` | time                  |       no | Owner-selected schedule snapshot                  |
| `timezone`             | text                  |       no | Default `'America/New_York'`                      |
| `status`               | `public.quote_status` |       no | Default `'draft'`                                 |
| `sent_at`              | timestamptz           |      yes | Set when sent                                     |
| `viewed_at`            | timestamptz           |      yes | Set when viewed                                   |
| `approved_at`          | timestamptz           |      yes | Must exist if status=`approved`                   |
| `declined_at`          | timestamptz           |      yes | Must exist if status=`declined`                   |
| `expires_at`           | timestamptz           |      yes | Optional expiry control                           |
| `booking_id`           | uuid                  |      yes | Future conversion target                          |
| `created_at`           | timestamptz           |       no | Default `now()`                                   |
| `updated_at`           | timestamptz           |       no | Default `now()`, trigger maintained               |

---

## Constraints

- `price_cents >= 0`
- `duration_minutes > 0`
- email format check via regex
- if `status='approved'`, `approved_at` must be non-null
- if `status='declined'`, `declined_at` must be non-null

`updated_at` maintained via trigger (`public.set_updated_at` + `trg_quotes_set_updated_at`).

---

## Indexes (performance)

Current recommended indexes:

- `(business_id, created_at DESC)`
  - fast quote list on dashboard
- `(business_id, status, created_at DESC)`
  - fast status filtering per business
- `(status)`
  - lifecycle/admin ops
- `(lower(customer_email))`
  - quick customer-email lookups
- `(scheduled_date, scheduled_start_time)`
  - schedule-oriented queries
- `(created_by_user_id, created_at DESC)`
  - owner-created audit/listing

---

## RLS model (current)

RLS enabled on `public.quotes`.

Policies for authenticated users:

- **SELECT**: owner can read quotes whose `business_id` belongs to their `business_profiles` row (`profile_id = auth.uid()`).
- **INSERT**: owner can insert only for businesses they own, and `created_by_user_id` must equal `auth.uid()`.
- **UPDATE**: owner can update only quotes for businesses they own.
- **DELETE**: owner can delete only quotes for businesses they own.

No public direct table access.

---

## Operational guidance

- Treat quote fields as snapshots; don’t depend on mutable service rows after send.
- Use idempotent backend logic for send/approve actions.
- Do not create booking row until quote is approved (future phase).
- Keep `booking_id` null until conversion is successful.

---

## Next table (planned)

When ready for link-based customer review:

- add `quote_public_links` with token hash, expiry, revoke, and view counters.

This keeps public access secure and separate from owner dashboard access.
