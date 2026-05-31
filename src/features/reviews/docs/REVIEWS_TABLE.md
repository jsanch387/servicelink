# `reviews` table

Customer feedback and owner replies. Part of the reviews database — see **[DATABASE.md](./DATABASE.md)** for full flows and diagrams.

Invites: [`REVIEW_INVITES_TABLE.md`](./REVIEW_INVITES_TABLE.md).

---

## Purpose

- **One review per customer per business** on the public profile (`reviews_business_customer_key` when `customer_id` is set).
- Each row still links to the **booking** and **invite** that earned it (`booking_id` / `review_invite_id` unique).
- Powers **owner dashboard** (inbox, reply, hide) and **public profile** (non-hidden rows).
- **`author_display_name`** snapshot at submit (stable if CRM name changes).

---

## Relationship

```text
review_invites (1) ──► reviews (0..1 until submit, then 1)
  │
  ├─ business_profiles (business_id)
  ├─ bookings (booking_id)
  └─ customers (customer_id, optional)
```

---

## Schema

Table: `public.reviews`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|--------|
| `id` | uuid | no | `gen_random_uuid()` | PK |
| `business_id` | uuid | no | — | FK → `business_profiles` CASCADE |
| `booking_id` | uuid | no | — | FK → `bookings` CASCADE, **unique** |
| `review_invite_id` | uuid | no | — | FK → `review_invites` CASCADE, **unique** |
| `customer_id` | uuid | yes | — | FK → `customers` SET NULL |
| `rating` | smallint | no | — | 1–5 |
| `body` | text | no | — | Trimmed length 1–2000 |
| `author_display_name` | text | no | — | Length 1–120 |
| `owner_reply_body` | text | yes | — | Length 1–1000 when set |
| `owner_replied_at` | timestamptz | yes | — | Required with reply body |
| `is_hidden` | boolean | no | `false` | Hidden from public profile only |
| `created_at` | timestamptz | no | `now()` | Customer submit time |
| `updated_at` | timestamptz | no | `now()` | Trigger-maintained |

---

## Constraints

- `reviews_rating_check` — `rating` between 1 and 5
- `reviews_body_length_check` — trimmed body 1–2000 chars
- `reviews_author_display_name_check` — 1–120 chars
- `reviews_owner_reply_consistency_check` — reply body and `owner_replied_at` both set or both null
- Trigger `reviews_enforce_relationships` — IDs align with `review_invites` and `bookings`

---

## Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `reviews_booking_id_key` | unique | Visit that produced this review |
| `reviews_review_invite_id_key` | unique | One review per invite |
| `reviews_business_customer_key` | unique partial | One review per customer per business |
| `reviews_business_id_created_at_idx` | btree | Dashboard inbox sort |
| `reviews_business_id_public_idx` | partial (`not is_hidden`) | Public profile lists |

---

## RLS

| Operation | `authenticated` | `anon` | `service_role` |
|-----------|-------------------|--------|----------------|
| SELECT | Own `business_id` | denied | allowed |
| INSERT | denied | denied | allowed (customer submit) |
| UPDATE | Own `business_id` | denied | allowed |
| DELETE | denied | denied | allowed |

Policies: `reviews_owner_select`, `reviews_owner_update`

### Owner may update (v1)

- `owner_reply_body`, `owner_replied_at`
- `is_hidden`

### Owner must not update (enforce in API)

- `rating`, `body`, `author_display_name`, `booking_id`, `review_invite_id`, `business_id`

### Customer may insert (service role only)

- Full row on valid pending invite

---

## Migrations

1. `migrations/002_reviews.sql`
2. [`migrations/003_one_review_per_customer.sql`](./migrations/003_one_review_per_customer.sql) — per-customer unique indexes

---

## Submit transaction (planned)

Single logical transaction (service role):

1. Lock / validate `review_invites` row (`pending`, not expired).
2. `INSERT INTO reviews (…)`.
3. `UPDATE review_invites SET status = 'submitted', submitted_at = now()`.

---

## Public vs dashboard visibility

| `is_hidden` | Dashboard | Public profile |
|-------------|-----------|----------------|
| `false` | visible | visible |
| `true` | visible | **hidden** |

Aggregates (average rating, count) should use `is_hidden = false` only.
