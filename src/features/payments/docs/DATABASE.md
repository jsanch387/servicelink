# Payments feature – database

This document describes the **Supabase tables** used by the payments feature (Stripe Connect, checkout/deposit settings). Use it when changing schema, writing migrations, or wiring RLS.

Related planning (Connect flow, partial onboarding, when rows update): **`CONNECT_ONBOARDING.md`**.

---

## Overview

| Table               | Cardinality        | Purpose |
|---------------------|--------------------|---------|
| `payment_accounts`  | One row per business | Stripe Connect account id + onboarding / capability flags. Drives “show setup vs show dashboard”. |
| `payment_settings`  | One row per business | Owner preferences: checkout mode, deposits, amounts, currency. |

Both reference `business_profiles(id)`. The app treats **`business_profiles`** as the tenant root; `profile_id` on that row links to the Supabase Auth user (owner).

---

## Table: `payment_accounts`

**Purpose:** Store the connected Stripe account id (`acct_…`) and enough state to know whether the business can accept charges and whether onboarding is complete or blocked.

**Used by (planned / future):**

- Dashboard **Payments** (gate: setup UI vs real payments UI)
- Connect onboarding API + return URL handler + Stripe webhooks (sync)

### Columns

| Column                 | Type        | Description |
|------------------------|------------|-------------|
| `id`                   | uuid       | Primary key. |
| `business_id`          | uuid       | FK → `business_profiles(id)`, **unique**, ON DELETE CASCADE. |
| `provider`             | text       | e.g. `'stripe'`. Constrained in SQL. |
| `stripe_account_id`    | text       | Stripe Connect account id (`acct_…`). **Unique**. |
| `onboarding_status`    | text       | One of: `not_started`, `in_progress`, `complete`, `restricted`. |
| `charges_enabled`      | boolean    | From Stripe account; can accept card payments when true (subject to product rules). |
| `payouts_enabled`      | boolean    | From Stripe account. |
| `details_submitted`    | boolean    | From Stripe account. |
| `requirements_status`  | text (nullable) | Optional snapshot for UX / support (e.g. outstanding requirements). |
| `connected_at`         | timestamptz (nullable) | First time we considered the account “linked” (product-defined). |
| `last_synced_at`       | timestamptz (nullable) | Last successful sync from Stripe (return handler or webhook). |
| `created_at` / `updated_at` | timestamptz | Audit; `updated_at` maintained by trigger where configured. |

### Constraints (intent)

- One payment account per business (`business_id` unique).
- One Stripe account id globally (`stripe_account_id` unique).

### Row Level Security (RLS)

Policies should allow **`authenticated`** users to **select / insert / update** only rows whose `business_id` belongs to a `business_profiles` row where `profile_id = auth.uid()`**. Deletes are typically denied for client roles (`using (false)` on delete).

**Service role** bypasses RLS for server-side webhooks and admin jobs.

---

## Table: `payment_settings`

**Purpose:** Persist how the business wants checkout to behave (deposits vs full pay, amounts, etc.). Separate from Stripe account state so UI and defaults can evolve without mixing into `payment_accounts`.

**Used by (planned / future):**

- Dashboard **Payments** checkout / deposit cards
- Public booking checkout (when implemented)

### Columns

| Column                      | Type        | Description |
|-----------------------------|------------|-------------|
| `id`                        | uuid       | Primary key. |
| `business_id`               | uuid       | FK → `business_profiles(id)`, **unique**, ON DELETE CASCADE. |
| `payment_account_id`      | uuid (nullable, unique) | Optional FK → `payment_accounts(id)` for strict linkage. |
| `checkout_mode`             | text       | e.g. `deposit_or_full`, `full_only`, `deposit_only` (exact enum from migration). |
| `deposits_enabled`          | boolean    | Master toggle for deposits. |
| `deposit_type`              | text       | `fixed` (amount in cents) or `percent` (0–100). |
| `deposit_value`             | integer    | Meaning depends on `deposit_type`. |
| `collect_remaining_balance` | boolean    | Whether balance is collected later in the flow. |
| `currency`                  | text       | Lowercase ISO currency (e.g. `usd`). |
| `updated_by`                | uuid (nullable) | Optional `auth.users` id for audit. |
| `created_at` / `updated_at` | timestamptz | Audit. |

### Row Level Security (RLS)

Same ownership model as `payment_accounts`: only the business owner (`business_profiles.profile_id = auth.uid()`) may read/write their row; client deletes typically denied.

### When a row exists (v1)

We **do not** insert a `payment_settings` row when a `business_profiles` row is created. Many profiles never go Pro or use payments; empty rows would be noise.

Create the row when the business is **past Connect onboarding** and is ready to configure checkout/deposits in the app—for example right after we detect **onboarding complete** (same request as syncing `payment_accounts`), or on the **first** load of the post-connect Payments screen if you prefer lazy creation. See **`CONNECT_ONBOARDING.md`**.

---

## Relationships (diagram)

```text
auth.users
    │
    └── profile_id ──► business_profiles (id)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      payment_accounts                 payment_settings
      (Stripe acct + flags)            (checkout / deposit prefs)
```

---

## Migrations

Schema is applied via Supabase SQL migrations (or SQL editor). When you add columns or policies:

1. Run migration in Supabase.
2. Update generated / hand-maintained TypeScript types (`Database` in `libs/supabase/client.ts` or generated types) so the app matches the DB.

---

## v1 scope note

**In-app transaction history** is intentionally deferred for v1; owners can use **Stripe Dashboard** (Express) for charges/refunds/payouts until a `payment_transactions` (or similar) table is added.
