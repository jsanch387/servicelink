# Table: `booking_checkout_sessions`

This document defines the `booking_checkout_sessions` table for Stripe Checkout orchestration.

- Status: implemented (v1) — see **`BOOKING_CHECKOUT_FLOW.md`** for the full flow
- Purpose: track checkout attempts and provide webhook reconciliation context
- Relationship: many checkout sessions over time; optional link to final `bookings` row

## Why this table exists

Webhook handlers need reliable server-side context to create/update booking/payment records.

This table stores:

- expected amount + payment kind (`deposit` / `full`)
- booking payload snapshot captured before redirect to Stripe
- Stripe ids (`checkout_session`, optional `payment_intent`)
- lifecycle state of each checkout session

Without this table, webhook processing depends on fragile metadata-only payloads.

## Core role in product flow

1. Customer clicks pay on booking page.
2. Server creates a `booking_checkout_sessions` row and Stripe Checkout session.
3. Server stores Stripe session id on that row.
4. Webhook arrives (`checkout.session.completed` etc.), row is looked up, validated, then booking/payment rows are created/updated.
5. Row status moves to `completed` / `failed` / `expired`.

## Proposed columns

| Column                       | Type          | Nullable | Notes                                                   |
| ---------------------------- | ------------- | -------: | ------------------------------------------------------- |
| `id`                         | `uuid`        |       no | PK, default `gen_random_uuid()`                         |
| `business_id`                | `uuid`        |       no | FK -> `business_profiles(id)`                           |
| `business_slug`              | `text`        |       no | slug snapshot for context/debug                         |
| `stripe_checkout_session_id` | `text`        |      yes | unique once created                                     |
| `stripe_payment_intent_id`   | `text`        |      yes | optional; available after payment intent creation       |
| `status`                     | `text`        |       no | `created`, `completed`, `expired`, `failed`, `canceled` |
| `payment_kind`               | `text`        |       no | `deposit` or `full`                                     |
| `selected_payment_method`    | `text`        |       no | `pay_now`, `pay_in_person`, `none`                      |
| `currency`                   | `text`        |       no | lowercase ISO-3                                         |
| `expected_amount_cents`      | `int4`        |       no | server-computed amount expected for this session        |
| `actual_amount_cents`        | `int4`        |      yes | amount reported after payment completion                |
| `booking_payload`            | `jsonb`       |       no | full booking snapshot for webhook processing            |
| `booking_id`                 | `uuid`        |      yes | FK -> `bookings(id)` after booking is created           |
| `completed_at`               | `timestamptz` |      yes | set when session reaches completed                      |
| `created_at`                 | `timestamptz` |       no | default `now()`                                         |
| `updated_at`                 | `timestamptz` |       no | default `now()`, trigger-maintained                     |

## Suggested constraints

- `stripe_checkout_session_id` unique (nullable until known).
- `expected_amount_cents >= 0`.
- `actual_amount_cents` null or `>= 0`.
- if `status = 'completed'`, require `completed_at IS NOT NULL`.
- status and payment_kind check constraints.

## Suggested indexes

- `idx_booking_checkout_sessions_business_id`
- `idx_booking_checkout_sessions_status`
- `idx_booking_checkout_sessions_business_status_created`
- `idx_booking_checkout_sessions_created_at`
- `idx_booking_checkout_sessions_booking_id`
- `idx_booking_checkout_sessions_payment_intent`
- partial index on non-null `stripe_checkout_session_id`

## RLS model (recommended)

- Select/update for authenticated owner of `business_id` (`business_profiles.profile_id = auth.uid()`).
- No broad client insert by default.
- Backend/service-role creates/updates rows in checkout + webhook handlers.

## Webhook idempotency note

Continue using `stripe_webhook_events` as idempotency source of truth:

- insert event id first (or in same transaction)
- skip duplicate events
- update `booking_checkout_sessions` + create booking/payment rows once per event
