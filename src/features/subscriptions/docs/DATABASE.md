# Memberships — data model

Reference for Supabase tables that back customer subscription plans. Verified against live Service Link schema and `src/libs/supabase/client.ts` `Database` types.

**Keeping it current:** When you change schema in Supabase, update this file, the hand-maintained `Database` types, and the SQL under [migrations/](./migrations/).

Related: [FLOWS.md](./FLOWS.md) (how rows are written/read), [migrations/README.md](./migrations/README.md).

---

## Overview

```
business_profiles
       │
       ├── membership_plans          (catalog: name, copy, soft-delete)
       │         │
       │         └── membership_plan_prices   (cadence options: week/month/year × amount)
       │
       ├── customer_memberships      (live subscribers — SELECT-only for owners)
       ├── membership_events         (append-only timeline)
       ├── membership_invoices       (invoice ledger)
       ├── payment_accounts          (Stripe Connect — required to offer plans)
       └── payment_settings          (payments_enabled — required to offer plans)
```

| Table                    | Cardinality       | Purpose                                       |
| ------------------------ | ----------------- | --------------------------------------------- |
| `membership_plans`       | Many per business | Plan catalog shown on booking link            |
| `membership_plan_prices` | Many per plan     | Billing cadence options (Stripe Price–shaped) |

**Phase 2 (SQL applied; Connect webhooks wired):** `customer_memberships`, `membership_events`, `membership_invoices`. Written by `/api/stripe/webhook-connect`.

**Obsolete:** `membership_settings` (per-business “turned on” flag) was dropped. Readiness = rollout + Pro + Connect + payments + presence of plans. See `004_drop_membership_settings.sql`.

---

## Table: `membership_plans`

**Purpose:** Owner-authored offer (name, description). Soft-delete hides from owner list and public link without canceling Stripe members (delete is blocked while active members exist).

**Used by:** Owner dashboard CRUD, public plan loader, Stripe Product sync via `stripe_product_id`.

### Columns

| Column                   | Type          | Nullable | Default             | Description                                                                 |
| ------------------------ | ------------- | -------- | ------------------- | --------------------------------------------------------------------------- |
| `id`                     | `uuid`        | no       | `gen_random_uuid()` | Primary key                                                                 |
| `business_id`            | `uuid`        | no       | —                   | FK → `business_profiles(id)` ON DELETE CASCADE                              |
| `name`                   | `text`        | no       | —                   | Plan title; CHECK non-empty trim                                            |
| `description`            | `text`        | no       | `''`                | Full owner copy (prose + bullets in one field)                              |
| `is_published`           | `boolean`     | no       | `true`              | Public loader requires `true`. Create always publishes; no owner toggle yet |
| `is_popular`             | `boolean`     | no       | `false`             | Optional highlight; create hardcodes `false`                                |
| `sort_order`             | `integer`     | no       | `0`                 | Owner list / public order                                                   |
| `visit_duration_minutes` | `integer`     | no       | `60`                | Visit length for slotting/bookings; CHECK 30–630, multiples of 30           |
| `stripe_product_id`      | `text`        | yes      | null                | Stripe Product on Connect (`prod_…`). Set on create/edit sync               |
| `deleted_at`             | `timestamptz` | yes      | null                | Soft-delete timestamp; null = active                                        |
| `created_at`             | `timestamptz` | no       | `now()`             | Created                                                                     |
| `updated_at`             | `timestamptz` | no       | `now()`             | Updated via `set_updated_at()` trigger                                      |

### Indexes (intent)

- `(business_id)`
- `(business_id)` WHERE `deleted_at IS NULL`
- `(business_id)` WHERE `is_published = true AND deleted_at IS NULL`

---

## Table: `membership_plan_prices`

**Purpose:** One row per billing cadence on a plan (e.g. weekly $49, monthly $159). Shape matches Stripe Price recurring fields.

**Used by:** Create/update plan APIs, public cards (price + cadence pills), Stripe Price sync / Checkout via `stripe_price_id`.

### Columns

| Column            | Type          | Nullable | Default             | Description                                                           |
| ----------------- | ------------- | -------- | ------------------- | --------------------------------------------------------------------- |
| `id`              | `uuid`        | no       | `gen_random_uuid()` | Primary key                                                           |
| `plan_id`         | `uuid`        | no       | —                   | FK → `membership_plans(id)` ON DELETE CASCADE                         |
| `business_id`     | `uuid`        | no       | —                   | FK → `business_profiles(id)` ON DELETE CASCADE (denormalized for RLS) |
| `interval_unit`   | `text`        | no       | —                   | CHECK IN (`week`, `month`, `year`)                                    |
| `interval_count`  | `integer`     | no       | —                   | CHECK `>= 1` (e.g. `2` + `week` = every 2 weeks)                      |
| `price_cents`     | `integer`     | no       | —                   | Amount per period in cents; DB `>= 0`, API requires `> 0`             |
| `currency`        | `text`        | no       | `'usd'`             | Lowercase ISO currency                                                |
| `is_default`      | `boolean`     | no       | `false`             | Pre-selected cadence on public card; first option on create           |
| `stripe_price_id` | `text`        | yes      | null                | Stripe Price on Connect (`price_…`). Set on create/edit sync          |
| `created_at`      | `timestamptz` | no       | `now()`             | Created                                                               |
| `updated_at`      | `timestamptz` | no       | `now()`             | Trigger-maintained                                                    |

### Constraints

- **Unique cadence per plan:** `(plan_id, interval_unit, interval_count)` — cannot offer two “monthly” rows on the same plan.

### Indexes (intent)

- `(plan_id)`, `(business_id)`

---

## Soft-delete vs hard-delete

| Action                          | Behavior                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| Owner deletes plan              | Sets `membership_plans.deleted_at`. Price rows remain (orphaned from UI). |
| Owner removes a cadence on edit | **Hard-deletes** that `membership_plan_prices` row                        |
| Create fails after plan insert  | Plan row **hard-deleted** (rollback)                                      |
| Active subscribers (future)     | Soft-delete **blocked** (HTTP 409); see `deleteMembershipPlanForBusiness` |

---

## Description storage

Owner writes one textarea. On save, the full text goes into `membership_plans.description` (including any bullet lines).

---

## App type mapping

| DB                          | Owner UI type               | Public UI type             |
| --------------------------- | --------------------------- | -------------------------- |
| `membership_plans` + prices | `OwnerSubscriptionPlan`     | `CustomerSubscriptionPlan` |
| price row                   | `SubscriptionCadenceOption` | same                       |

Mapper: `server/mapMembershipPlanRow.ts`.

Cadence presets in the wizard (`OWNER_CADENCE_PRESETS`): weekly (`week`/1), every 2 weeks (`week`/2), monthly (`month`/1). DB also allows `year`.

---

## RLS

Both tables: RLS enabled. **Authenticated** owners get SELECT / INSERT / UPDATE / DELETE where:

`business_id IN (SELECT id FROM business_profiles WHERE profile_id = auth.uid())`

No anon/public policies. Public booking-link reads use the **admin / service-role** client in `loadPublicMembershipPlans`.

`service_role` bypasses RLS (webhooks / public loaders).

---

## Phase 2 tables (webhooks write)

| Table                  | Role                                                      |
| ---------------------- | --------------------------------------------------------- |
| `customer_memberships` | Current Stripe Subscription state per customer            |
| `membership_events`    | Append-only lifecycle timeline (`stripe_event_id` unique). `event_type` CHECK includes `checkout_completed`, `initial_booking_created`, subscription/invoice/cancel types, and `other`. |
| `membership_invoices`  | Invoice / payment ledger                                  |

`customer_memberships.initial_booking_id` → first-visit `bookings.id` (set by webhook after Checkout; idempotency).

`customer_memberships.period_visit_booking_id` / `period_visit_period_start` → visit for the current Stripe period. When `current_period_start` advances past `period_visit_period_start` (or no booking), owner UI shows **Needs visit**. Completing the linked booking shows **Visit completed** until the next Stripe period. Owner Book visit, public `/{slug}/membership/visit`, and webhook first visit set these columns. `notes` is owner-only text (saved via API with service role after ownership check).

`customer_memberships.metadata.visit_reminder_sent_for_period_start` → idempotency for next-period reminder email/SMS (ISO timestamp matching `current_period_start`).

**RLS:** owners **SELECT** only; writes via `service_role` (webhooks / trusted owner APIs). See [migrations/005–007](./migrations/).

`countActivePlanSubscribers` counts `status in ('active','trialing','past_due','unpaid','paused')` and excludes cancel-at-period-end / future `cancel_at` (same as the Active list filter).

---

## Stripe ID columns

| Column              | Table                    | Filled when                                                  |
| ------------------- | ------------------------ | ------------------------------------------------------------ |
| `stripe_product_id` | `membership_plans`       | Create/edit via `syncMembershipPlanStripeCatalog` on Connect |
| `stripe_price_id`   | `membership_plan_prices` | Same sync — one Price per cadence                            |

Metadata on Stripe objects: `membership_plan_id`, `business_id`, and on Prices also `membership_plan_price_id`.

Amount/interval changes create a **new** Stripe Price (old Price archived `active: false` best-effort). Soft-delete of a plan archives Stripe Product + Prices (`active: false`) best-effort; rows and `stripe_*` IDs remain in our DB.

Plans created before sync shipped may still have null IDs until the next successful edit (or a future backfill). Recurring Checkout should use stored Price IDs.
