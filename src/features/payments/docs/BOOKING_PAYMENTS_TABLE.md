# Table: `booking_payments`

This document defines the `booking_payments` table for availability bookings with payments.

- Status: implemented (v1) — see **`BOOKING_CHECKOUT_FLOW.md`** for when rows are written
- Purpose: one payment summary row per booking
- Relationship: **1:1** with `bookings` via `booking_id UNIQUE`

## Why this table exists

`bookings` already stores scheduling and customer details. `booking_payments` keeps payment state separate so:

- booking rows stay focused on appointment data
- owner UI can clearly show paid/deposit/remaining
- payment logic can grow without bloating `bookings`

## Core role in product flow

- Payments disabled or not required: still create a `booking_payments` row with a non-online status.
- Stripe checkout path: webhook updates/creates payment outcome and links the checkout session id.
- Owner dashboard reads payment info from this table to display:
  - paid full
  - deposit paid + remaining
  - pay in person / no online payment

## Proposed columns

| Column                         | Type          | Nullable | Notes                                                                     |
| ------------------------------ | ------------- | -------: | ------------------------------------------------------------------------- |
| `id`                           | `uuid`        |       no | PK, default `gen_random_uuid()`                                           |
| `booking_id`                   | `uuid`        |       no | FK -> `bookings(id)`, `UNIQUE`, `ON DELETE CASCADE`                       |
| `business_id`                  | `uuid`        |       no | FK -> `business_profiles(id)`                                             |
| `provider`                     | `text`        |       no | `none` or `stripe`                                                        |
| `payment_status`               | `text`        |       no | `not_required`, `awaiting_payment`, `deposit_paid`, `paid_full`, `failed` |
| `payment_method_selected`      | `text`        |       no | `none`, `pay_in_person`, `pay_now`                                        |
| `currency`                     | `text`        |       no | lowercase ISO-3 (e.g. `usd`)                                              |
| `total_amount_cents`           | `int4`        |       no | Total booking price snapshot                                              |
| `required_online_amount_cents` | `int4`        |       no | Amount required online to secure booking                                  |
| `paid_online_amount_cents`     | `int4`        |       no | Amount actually paid online                                               |
| `remaining_amount_cents`       | `int4`        |       no | Amount still owed in person/later                                         |
| `deposit_type`                 | `text`        |      yes | `fixed` / `percent` when deposit config applied                           |
| `deposit_value`                | `int4`        |      yes | cents if fixed, whole percent if percent                                  |
| `last_checkout_session_id`     | `text`        |      yes | Stripe checkout session id used for latest successful/attempted checkout  |
| `paid_at`                      | `timestamptz` |      yes | Timestamp when online payment succeeded                                   |
| `created_at`                   | `timestamptz` |       no | default `now()`                                                           |
| `updated_at`                   | `timestamptz` |       no | default `now()`, trigger-maintained                                       |

## Suggested constraints

- `booking_id` unique to enforce one-to-one.
- money fields `>= 0`.
- `required_online_amount_cents <= total_amount_cents`.
- `paid_online_amount_cents <= total_amount_cents`.
- `remaining_amount_cents = GREATEST(total_amount_cents - paid_online_amount_cents, 0)`.
- if `deposit_type` is null, `deposit_value` should be null; if not null, both present.
- if `deposit_type = 'percent'`, `deposit_value` should be `0..100`.

## Suggested indexes

- `idx_booking_payments_business_id`
- `idx_booking_payments_status`
- `idx_booking_payments_business_status`
- `idx_booking_payments_paid_at`
- optional: `idx_booking_payments_last_checkout_session_id`

## RLS model (recommended)

- Select/update for authenticated owner of `business_id` (`business_profiles.profile_id = auth.uid()`).
- No broad client insert policy by default.
- Backend/service-role writes rows during booking + webhook flows.

## Notes

- Keep status vocabulary small in v1 to avoid complexity creep.
- This table is summary-level. Detailed checkout attempts/events live in `booking_checkout_sessions`.
