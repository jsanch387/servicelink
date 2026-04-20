# Payments feature – database

This document is the **reference for `payment_accounts` and `payment_settings`** in Supabase. Use it when wiring the app, writing migrations, or reviewing RLS.

**Keeping it current:** When you change the schema in Supabase, update this file and the hand-maintained `Database` types in `src/libs/supabase/client.ts` so the app and docs stay aligned. Column order below matches the **Table Editor** layout (nullable = hollow diamond, required = solid).

Related flow notes: **`CONNECT_ONBOARDING.md`**.
Broader schema context snapshot: **`SUPABASE_SCHEMA_CONTEXT.md`**.

---

## Overview

| Table               | Cardinality         | Purpose |
|---------------------|---------------------|---------|
| `payment_accounts`  | One row per business | Stripe Connect account id (`acct_…`) and capability / onboarding flags. |
| `payment_settings`  | One row per business | ServiceLink checkout: **payments on/off**, **checkout mode** (how customers pay), **deposits**, currency. |

Both tables reference **`business_profiles(id)`** (tenant root). The owner is `business_profiles.profile_id` → `auth.users`.

---

## Table: `payment_accounts`

**Purpose:** Know whether Stripe Connect is linked, onboarding is complete, and whether charges/payouts are enabled. Drives Payments UI (setup vs dashboard).

**Used by:** Connect onboarding, return URL / sync, dashboard Payments, webhooks (when implemented).

### Columns (Supabase order)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | no | Primary key. |
| `business_id` | `uuid` | no | FK → `business_profiles(id)`. **Unique** per business. |
| `provider` | `text` | no | e.g. `stripe`. |
| `stripe_account_id` | `text` | no | Stripe Connect account id (`acct_…`). **Unique** globally. |
| `onboarding_status` | `text` | no | App enums include `not_started`, `in_progress`, `complete`, `restricted` (align with your CHECK). |
| `charges_enabled` | `bool` | no | From Stripe; card payments when true (subject to product rules). |
| `payouts_enabled` | `bool` | no | From Stripe. |
| `details_submitted` | `bool` | no | From Stripe. |
| `requirements_status` | `text` | yes | Optional snapshot (e.g. outstanding requirements). |
| `connected_at` | `timestamptz` | yes | When the account was first considered linked (product-defined). |
| `last_synced_at` | `timestamptz` | yes | Last successful sync from Stripe (return handler / webhook). |
| `created_at` | `timestamptz` | no | Created at. |
| `updated_at` | `timestamptz` | no | Updated at (trigger-maintained if configured). |

### Constraints (intent)

- One Connect account row per business (`business_id` unique).
- One Stripe account id per deployment (`stripe_account_id` unique).

### Row Level Security (RLS)

**Authenticated** users: **select / insert / update** only where `business_id` belongs to a `business_profiles` row with `profile_id = auth.uid()`. Deletes usually denied for client roles.

**Service role:** bypasses RLS (webhooks, server jobs).

---

## Table: `payment_settings`

**Purpose:** Owner-controlled ServiceLink behavior: global **payments** toggle, **how customers pay** (`checkout_mode`), **deposit** rules, **currency**. Separate from live Stripe flags in `payment_accounts`.

**Used by:** Dashboard Payments (toggle, “How customers pay”, deposits), public booking checkout (future).

### Columns (Supabase order)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `uuid` | no | Primary key. |
| `business_id` | `uuid` | no | FK → `business_profiles(id)`. **Unique** per business. |
| `payment_account_id` | `uuid` | yes | Optional FK → `payment_accounts(id)` (link row to the Connect account used when payments were enabled). |
| `checkout_mode` | `text` | yes | **Checkout mode** — how the customer pays; see next section. `NULL` until the owner saves a choice. |
| `deposits_enabled` | `bool` | no | Whether deposits are used for bookings. |
| `deposit_type` | `text` | no | `fixed` (amount in cents) or `percent` (0–100). |
| `deposit_value` | `int4` | no | Interpretation depends on `deposit_type`. |
| `collect_remaining_balance` | `bool` | no | Whether remaining balance is collected later in the flow. |
| `currency` | `text` | no | Lowercase ISO currency (e.g. `usd`). |
| `updated_by` | `uuid` | yes | Optional `auth.users` id for audit. |
| `created_at` | `timestamptz` | no | Created at. |
| `updated_at` | `timestamptz` | no | Updated at. |
| `payments_enabled` | `bool` | no | When **true**, ServiceLink checkout is active on the booking experience; Stripe can stay connected while this is **false**. |

### Deposits: `deposit_type` + `deposit_value` (one amount, two shapes)

The row stores **one** deposit amount; `deposit_type` says how to read `deposit_value`:

| `deposit_type` | `deposit_value` means |
|------------------|------------------------|
| `fixed` | Amount in **cents** (e.g. `5000` = $50.00). |
| `percent` | Whole **percent** of the service price (e.g. `10` = 10%). |

**Why not separate `deposit_dollars` and `deposit_percentage` columns?** You can, but you then need a rule in SQL (e.g. CHECK) that **only one** is used when deposits are on, and you still carry a “mode” or infer from nullability. The **type + single integer** pattern is common, avoids two live numbers disagreeing, and keeps the row small. **Conflicts** only appear if code writes `deposit_value` for the wrong unit; prevent that by **always updating `deposit_type` and `deposit_value` together** on save (as the app API does). Optional hardening: a Postgres CHECK that `deposit_type = 'percent'` implies `deposit_value` between 0 and 100, and `fixed` implies non-negative.

### `checkout_mode` (CHECK)

**Allowed values:** `NULL` **or** exactly one of:

| Value | Meaning |
|-------|---------|
| `in_person` | **In person only** — owner collects when they meet the customer; no card checkout in the app for that path. |
| `in_app` | **In the app only** — customer pays **in full by card in the app** when booking online. |
| `customer_choice` | **Customer chooses at checkout** — card in app or pay owner in person. |

Canonical SQL: **`src/features/payments/docs/sql/payment_settings_checkout_mode_constraint.sql`**

Inspect constraints:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'payment_settings'::regclass
  AND contype = 'c';
```

### Row Level Security (RLS)

Same ownership model as `payment_accounts`: owner-only read/write on their business row; client deletes typically denied.

### When a row exists (v1)

`payment_settings` is **not** created at business signup. A row appears when the owner first enables ServiceLink payments after Stripe Connect is ready (see **`CONNECT_ONBOARDING.md`**).

---

## Relationships

```text
auth.users
    │
    └── profile_id ──► business_profiles (id)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      payment_accounts                 payment_settings
      (Stripe Connect)                 (checkout + deposits + payments_enabled)
              ▲                               │
              └──── payment_account_id (optional FK) ────┘
```

---

## Migrations & types

1. Apply SQL in Supabase (migrations or SQL editor).
2. Update **`src/features/payments/docs/DATABASE.md`** (this file) if columns, nullability, or semantics change.
3. Update **`src/libs/supabase/client.ts`** `Database['public']['Tables']` entries for `payment_accounts` and `payment_settings` so TypeScript matches PostgREST.

---

## v1 scope note

**In-app transaction history** is deferred for v1; owners use **Stripe Dashboard** (Express) for charges/refunds/payouts until a transactions table exists.
