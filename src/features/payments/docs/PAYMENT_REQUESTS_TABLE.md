# Table: `payment_requests`

Merchant-scoped walk-up charges (Home → Create payment). These rows are **not** bookings and must not write `booking_payments`.

- Status: implemented for **payment links** and **Tap to Pay** (v1)
- Purpose: persist amount + note + Stripe ids so the webhook can mark the charge paid
- Relationship: many rows per `business_id`

SQL: **`sql/001_payment_requests.sql`** (table + RLS) then **`sql/002_payment_requests_short_code.sql`** (columns only; RLS unchanged).

---

## Why this table exists

`POST /api/payments/link` returns a short ServiceLink URL (`/p/{short_code}`). That page sends the customer to Stripe Checkout. Mobile does not poll.

Without this row, `checkout.session.completed` has only Stripe metadata. We already rejected that pattern for booking checkout.

---

## Columns

| Column                         | Type          | Nullable | Notes                                              |
| ------------------------------ | ------------- | -------: | -------------------------------------------------- |
| `id`                           | `uuid`        |       no | PK                                                 |
| `business_id`                  | `uuid`        |       no | FK → `business_profiles(id)`                       |
| `created_by`                   | `uuid`        |      yes | Owner `auth.users` id                              |
| `collection_method`            | `text`        |       no | `checkout_link` or `tap_to_pay`                    |
| `status`                       | `text`        |       no | `open`, `paid`, `expired`, `canceled`, `failed`    |
| `amount_cents`                 | `int4`        |       no | Owner-typed amount (> 0)                           |
| `currency`                     | `text`        |       no | `usd`                                              |
| `note`                         | `text`        |       no | Required; 1–200 chars                              |
| `short_code`                   | `text`        |      yes | Unique share code for `/p/{code}`                  |
| `stripe_checkout_session_id`   | `text`        |      yes | Unique when set (`cs_…`)                           |
| `stripe_checkout_url`          | `text`        |      yes | Hosted Checkout URL (not shared with the owner)    |
| `stripe_payment_intent_id`     | `text`        |      yes | Set on Tap to Pay create; Checkout when paid       |
| `paid_amount_cents`            | `int4`        |      yes | Stripe `amount_total` after success                |
| `paid_at`                      | `timestamptz` |      yes | Required when `status = paid`                      |
| `created_at`                   | `timestamptz` |       no | default `now()`                                    |
| `updated_at`                   | `timestamptz` |       no | `public.set_updated_at()`                          |

---

## RLS

| Role              | Access                                      |
| ----------------- | ------------------------------------------- |
| `authenticated`   | **SELECT** rows for the owner’s business    |
| `anon`            | none                                        |
| `service_role`    | ALL (create-link API + webhook)             |

No client insert/update. Mobile never writes this table directly.

---

## Status flow (payment link)

```text
open  →  paid      (checkout.session.completed, amount matches)
open  →  failed    (Stripe create failed, or webhook amount mismatch)
open  →  expired   (checkout.session.expired, or `/p/…` sees Stripe status expired)
open  →  canceled  (reserved)
```

## Status flow (Tap to Pay)

```text
open  →  paid      (payment_intent.succeeded, amount matches)
open  →  failed    (Stripe create failed, payment_failed, or amount mismatch)
open  →  canceled  (payment_intent.canceled)
open               (owner backs out; unused PI may expire)
```
