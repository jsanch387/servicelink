# Marketing — database schema (v1)

Tables, booking extensions, indexes, and RLS for **promo codes** and **sales**.

**Ready-to-run SQL:** [`migrations/`](./migrations/) — idempotent scripts for Supabase SQL Editor (prod-safe: new tables + nullable `bookings` columns only). See [`migrations/README.md`](./migrations/README.md) for run order and rollback notes.

---

## ER overview

```
business_profiles (existing)
    │
    ├── promo_codes
    │       └── promo_code_redemptions ──► bookings
    │
    └── sales

bookings (existing) ──► discount snapshot columns + optional FKs
```

---

## `promo_codes`

| Column                 | Type                                | Notes                                                                                           |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`                   | `uuid` PK                           | `gen_random_uuid()`                                                                             |
| `business_id`          | `uuid` FK → `business_profiles(id)` | Required. ON DELETE CASCADE.                                                                    |
| `code`                 | `text`                              | Uppercase stored. **Unique per business** (case-insensitive via unique index on `upper(code)`). |
| `description`          | `text`                              | Nullable internal note.                                                                         |
| `discount_type`        | `text`                              | `'percentage'` \| `'fixed_amount'`. CHECK constraint.                                           |
| `discount_value`       | `numeric`                           | %: 0–100. Fixed: dollars (store as numeric; convert to cents in app).                           |
| `starts_at`            | `timestamptz`                       | Nullable = no start bound.                                                                      |
| `ends_at`              | `timestamptz`                       | Nullable = no end bound.                                                                        |
| `one_use_per_customer` | `boolean`                           | Default `true`.                                                                                 |
| `is_active`            | `boolean`                           | Default `true`.                                                                                 |
| `created_at`           | `timestamptz`                       | `now()`                                                                                         |
| `updated_at`           | `timestamptz`                       | `now()`                                                                                         |

**Indexes**

- `unique (business_id, upper(code))`
- `(business_id, is_active)` — list dashboard

**RLS**

- Owner (`business_profiles.profile_id = auth.uid()`) → full CRUD on their `business_id`.
- Public read for validation: **no** direct anon SELECT; use **service role** in API with business slug + code validation only.

---

## `sales`

| Column           | Type                                | Notes                                   |
| ---------------- | ----------------------------------- | --------------------------------------- |
| `id`             | `uuid` PK                           |                                         |
| `business_id`    | `uuid` FK → `business_profiles(id)` | Required.                               |
| `name`           | `text`                              | Display name (e.g. “4th of July Sale”). |
| `description`    | `text`                              | Nullable.                               |
| `discount_type`  | `text`                              | `'percentage'` \| `'fixed_amount'`.     |
| `discount_value` | `numeric`                           | Same semantics as promo.                |
| `starts_at`      | `timestamptz`                       | Required.                               |
| `ends_at`        | `timestamptz`                       | Required. `ends_at > starts_at`.        |
| `is_active`      | `boolean`                           | Default `true`.                         |
| `created_at`     | `timestamptz`                       |                                         |
| `updated_at`     | `timestamptz`                       |                                         |

**Constraints**

- At most **one** row with `is_active = true` per `business_id` (partial unique index or enforced in server action).

**Indexes**

- `(business_id, is_active)`
- `(business_id, starts_at, ends_at)` — resolve sale for service date

**RLS**

- Same owner CRUD as `promo_codes`.

---

## `promo_code_redemptions`

Written at **job completion** when a promo code discount is confirmed.

| Column                      | Type                          | Notes                                                      |
| --------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `id`                        | `uuid` PK                     |                                                            |
| `promo_code_id`             | `uuid` FK → `promo_codes(id)` |                                                            |
| `booking_id`                | `uuid` FK → `bookings(id)`    | Unique per booking (one redemption per completed booking). |
| `business_id`               | `uuid` FK                     | Denormalized for queries.                                  |
| `customer_phone_normalized` | `text`                        | Nullable. Digits-only / E.164 — match CRM normalization.   |
| `customer_email_normalized` | `text`                        | Nullable. `lower(trim(email))`.                            |
| `redeemed_at`               | `timestamptz`                 | `now()`                                                    |

**Uniqueness (one use per customer per code)**

- Partial unique: `(promo_code_id, customer_phone_normalized)` WHERE `customer_phone_normalized` IS NOT NULL AND `customer_phone_normalized <> ''`
- Partial unique: `(promo_code_id, customer_email_normalized)` WHERE phone is null/empty AND email is non-null

**RLS**

- Owner SELECT on their `business_id`.
- INSERT via service role at completion (or owner policy if completion runs as authenticated user).

---

## `bookings` — new columns (discount snapshot)

Extend existing **`bookings`** table ([BOOKINGS_TABLE.md](../../availability/docs/BOOKINGS_TABLE.md)).

| Column                   | Type                          | Notes                                                                              |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------- |
| `discount_source`        | `text`                        | `'promo'` \| `'sale'` \| NULL                                                      |
| `discount_promo_code_id` | `uuid` FK → `promo_codes(id)` | Nullable. ON DELETE SET NULL.                                                      |
| `discount_sale_id`       | `uuid` FK → `sales(id)`       | Nullable.                                                                          |
| `discount_type`          | `text`                        | Snapshot: `'percentage'` \| `'fixed_amount'`.                                      |
| `discount_value`         | `numeric`                     | Snapshot value at attach time.                                                     |
| `subtotal_cents`         | `integer`                     | Pre-discount subtotal at last calculation (book + optional refresh on reschedule). |
| `discount_cents`         | `integer`                     | Computed discount amount in cents (0 if none). Set/refresh at completion.          |
| `discount_label`         | `text`                        | Display: code string or sale name.                                                 |

**Notes**

- **Deposit** columns (if separate) remain on **pre-discount** basis — do not change existing deposit calculation inputs.
- On reschedule, update snapshot fields when eligibility changes.
- `discount_cents` may be estimated at book time; **authoritative** value at completion.

---

## Business timezone

- Read from business profile or availability settings (confirm single source when implementing).
- Sale/code date boundaries: convert `scheduled_date` + business TZ ↔ compare to `starts_at`/`ends_at` stored as timestamptz (store sale dates as start-of-day / end-of-day in business TZ converted to UTC).

---

## Discount calculation (app layer)

```text
subtotal_cents = service + add-ons (integer cents)

if discount_type == 'percentage':
  discount_cents = min(subtotal_cents, round(subtotal_cents * value / 100))
else: # fixed_amount
  discount_cents = min(subtotal_cents, dollars_to_cents(value))

adjusted_total_cents = subtotal_cents - discount_cents
amount_to_collect_cents = max(0, adjusted_total_cents - deposit_paid_cents)
```

---

## Pro gate (application)

No separate DB column required — use **`isProAccess(profile)`** on owner:

- CRUD marketing tables: require Pro.
- Public redemption: require business owner Pro at **booking time** and **completion time** (if not Pro, treat as no marketing discounts).

Optional future: `marketing_disabled_at` on profile when downgraded — v1 can rely on `isProAccess` only.

---

## Migration order (suggested)

1. `promo_codes`
2. `sales` (+ partial unique on active sale)
3. `promo_code_redemptions`
4. `bookings` discount columns
5. RLS policies
6. Backfill not required (greenfield)

---

## Example queries

**List promo codes for dashboard**

```sql
select * from promo_codes
where business_id = $1
order by created_at desc;
```

**Active sale for service date** (pseudocode — TZ in app)

```sql
select * from sales
where business_id = $1
  and is_active = true
  and starts_at <= $service_end_utc
  and ends_at >= $service_start_utc
limit 1;
```

**Check promo not redeemed for customer**

```sql
select 1 from promo_code_redemptions
where promo_code_id = $1
  and (
    customer_phone_normalized = $2
    or (customer_phone_normalized is null and customer_email_normalized = $3)
  );
```
