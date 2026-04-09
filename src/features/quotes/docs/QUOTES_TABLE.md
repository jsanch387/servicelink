# Quotes table (owner + customer request flow)

For **API routes, UI entry points, and file map**, see [README.md](./README.md) in this folder.

This doc describes the current **`quotes`** table used for both:

- owner-created quotes from dashboard (`New Quote`)
- customer-submitted quote requests from public profile (`Request Quote`)

Scope here is **quotes table only** (public link table is documented separately in `QUOTE_PUBLIC_LINKS_TABLE.md`).

---

## Purpose

`quotes` stores a quote as a **separate lifecycle entity** from `bookings`.

- Quote can start as a customer request, then be completed and sent by owner.
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

## Source + status lifecycle (current)

Enum: `public.quote_status`

- `requested`
- `draft`
- `sent`
- `viewed`
- `approved`
- `declined`
- `expired`
- `cancelled`

Quote source:

- `source = owner_created`
- `source = customer_requested`

Recommended practical transitions:

- owner-created: `draft -> sent -> viewed -> approved/declined/expired/cancelled`
- customer-requested: `requested -> draft (optional) -> sent -> viewed -> approved/declined/expired/cancelled`
- `sent -> viewed`
- `approved -> (future) booking conversion with booking_id`

---

## Schema summary

Table: `public.quotes`

| Column                 | Type                  | Nullable | Notes                                                               |
| ---------------------- | --------------------- | -------: | ------------------------------------------------------------------- |
| `id`                   | uuid                  |       no | PK, default `gen_random_uuid()`                                     |
| `business_id`          | uuid                  |       no | FK -> `business_profiles(id)` `ON DELETE CASCADE`                   |
| `source`               | `public.quote_source` |       no | `owner_created` or `customer_requested`                             |
| `created_by_user_id`   | uuid                  |      yes | Usually owner id; can be null for customer-requested intake rows    |
| `requested_at`         | timestamptz           |      yes | Set for customer-requested rows                                     |
| `customer_name`        | text                  |       no | Snapshot                                                            |
| `customer_email`       | text                  |       no | Snapshot, format check                                              |
| `customer_phone`       | text                  |      yes | Snapshot                                                            |
| `vehicle_year`         | text                  |      yes | Optional snapshot                                                   |
| `vehicle_make`         | text                  |      yes | Optional snapshot                                                   |
| `vehicle_model`        | text                  |      yes | Optional snapshot                                                   |
| `service_name`         | text                  |      yes | Nullable during request-stage; required once quote is sent/later    |
| `price_cents`          | integer               |      yes | Nullable during request-stage; required once quote is sent/later    |
| `duration_minutes`     | integer               |      yes | Nullable during request-stage; required once quote is sent/later    |
| `note`                 | text                  |      yes | Optional owner note                                                 |
| `request_message`      | text                  |      yes | Optional customer request note/message                              |
| `scheduled_date`       | date                  |      yes | Nullable during request-stage; required once quote is sent/later    |
| `scheduled_start_time` | time                  |      yes | Nullable during request-stage; required once quote is sent/later    |
| `timezone`             | text                  |      yes | Optional early; recommended before send                             |
| `status`               | `public.quote_status` |       no | Includes `requested`; defaults depend on flow                       |
| `sent_at`              | timestamptz           |      yes | Set when sent                                                       |
| `viewed_at`            | timestamptz           |      yes | Set when viewed                                                     |
| `approved_at`          | timestamptz           |      yes | Must exist if status=`approved`                                     |
| `declined_at`          | timestamptz           |      yes | Must exist if status=`declined`                                     |
| `expires_at`           | timestamptz           |      yes | Optional expiry control                                             |
| `booking_id`           | uuid                  |      yes | Future conversion target                                            |
| `created_at`           | timestamptz           |       no | Default `now()`                                                     |
| `updated_at`           | timestamptz           |       no | Default `now()`, trigger maintained                                 |

---

## Constraints

- `price_cents >= 0`
- `duration_minutes > 0`
- email format check via regex
- if `status='approved'`, `approved_at` must be non-null
- if `status='declined'`, `declined_at` must be non-null
- if `source='customer_requested'`, `requested_at` must be non-null
- if status is `sent/viewed/approved/declined/expired/cancelled`, quote detail fields must be complete (`service_name`, `price_cents`, `duration_minutes`, `scheduled_date`, `scheduled_start_time`)

`updated_at` maintained via trigger (`public.set_updated_at` + `trg_quotes_set_updated_at`).

---

## Indexes (performance)

Current recommended indexes:

- `(business_id, created_at DESC)`
  - fast quote list on dashboard
- `(business_id, status, created_at DESC)`
  - fast status filtering per business
- `(business_id, source, created_at DESC)`
  - fast split by owner-created vs customer-requested
- `(business_id, status, source, created_at DESC)`
  - fast combined filtering by status + source
- `(status)`
  - lifecycle/admin ops
- `(lower(customer_email))`
  - quick customer-email lookups
- `(scheduled_date, scheduled_start_time)`
  - schedule-oriented queries
- `(created_by_user_id, created_at DESC)`
  - owner-created audit/listing
- `(requested_at DESC) where source='customer_requested'`
  - inbox-style newest-request queries

---

## RLS model (current)

RLS enabled on `public.quotes`.

Policies for authenticated users:

- **SELECT**: owner can read quotes whose `business_id` belongs to their `business_profiles` row (`profile_id = auth.uid()`).
- **INSERT**: owner can insert only for businesses they own.
  - owner-created rows require `created_by_user_id = auth.uid()`
  - customer-requested rows may have `created_by_user_id is null`
- **UPDATE**: owner can update only quotes for businesses they own.
- **DELETE**: owner can delete only quotes for businesses they own.

No public direct table access.

---

## Operational guidance

- Treat quote fields as snapshots; don’t depend on mutable service rows after send.
- Use `source` + `status` together to drive UI buckets (`Requested`, `Drafts`, `Sent`, etc.).
- Use idempotent backend logic for send/approve actions.
- For customer request intake, create row as `source='customer_requested'`, `status='requested'`, no public link yet.
- Create `quote_public_links` row only when owner actually sends quote.
- Do not create booking row until quote is approved (future phase).
- Keep `booking_id` null until conversion is successful.

---

## Related table

`quote_public_links` stores secure tokenized links for sent quotes.  
See: `src/features/quotes/docs/QUOTE_PUBLIC_LINKS_TABLE.md`.
