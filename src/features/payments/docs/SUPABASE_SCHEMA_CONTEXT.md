# Supabase Schema Context (Reference)

This file is a **human-readable schema context snapshot** for the current app database.

- Source: manual SQL dump provided in chat.
- Purpose: help implementation planning and AI/code context.
- Not a migration file; **do not run this document as SQL**.

## Scope

Tables included in the provided snapshot:

- `booking_requests`
- `bookings`
- `booking_payments` (planned)
- `booking_checkout_sessions` (planned)
- `business_availability`
- `business_images`
- `business_profiles`
- `business_services`
- `customers`
- `notifications`
- `payment_accounts`
- `payment_settings`
- `profiles`
- `quote_public_links`
- `quotes`
- `service_addon_assignments`
- `service_addons`
- `service_price_options`
- `stripe_webhook_events`

## High-level domain map

### Business and ownership

- `profiles` (owner/user account profile; linked to `auth.users`)
- `business_profiles` (one owner can have a business profile; public identity like `business_slug`)
- Most business-scoped tables anchor via `business_id -> business_profiles(id)`

### Booking systems

- Legacy request flow: `booking_requests` (pending/approved/declined/cancelled)
- Availability flow (V2): `bookings` (confirmed/completed/cancelled exact slot)
- Calendar controls: `business_availability` (weekly schedule, time-off, accept toggle)

### Services and pricing

- `business_services`
- `service_price_options` (per-service pricing/duration variants)
- `service_addons`
- `service_addon_assignments`

### Customer CRM

- `customers` (deduped per business)
- `bookings.customer_id` optionally points to `customers.id`

### Payments

- `payment_accounts` (Stripe Connect account and capabilities)
- `payment_settings` (payments_enabled, checkout mode, deposits config, currency)
- `booking_payments` (1:1 payment summary per booking)
- `booking_checkout_sessions` (Stripe checkout session lifecycle + webhook payload context)
- `stripe_webhook_events` (idempotency/event ledger for processed webhook ids)

### Quotes

- `quotes`
- `quote_public_links`

### Notifications

- `notifications` (user-facing in-app notifications)

## Booking-related tables in current schema

### `bookings` (current)

Current core columns indicate this is an appointment record, not a payment record:

- Scheduling: `scheduled_date`, `start_time`, `duration_minutes`
- Service snapshot: `service_id`, `service_name`, `service_price_cents`, `addon_details`
- Customer snapshot: name/email/phone/address/vehicle/notes
- Lifecycle: `status` (`confirmed`/`completed`/`cancelled`)
- Relationships: `business_id`, optional `customer_id`

No dedicated payment lifecycle fields are currently present.

### `payment_settings` (current)

Already models owner payment policy:

- `payments_enabled`
- `checkout_mode`: `in_person`, `in_app`, `customer_choice` (or null)
- Deposit rules: `deposits_enabled`, `deposit_type` (`fixed`/`percent`), `deposit_value`
- `currency`, `collect_remaining_balance`

### `payment_accounts` (current)

Tracks Stripe account readiness:

- `stripe_account_id`
- `charges_enabled`, `payouts_enabled`
- onboarding flags and timestamps

### `stripe_webhook_events` (current)

Primary key is `event_id`; used to avoid duplicate event processing.

## Current relationship sketch

```text
auth.users
   └─ profiles(user_id)
      └─ business_profiles(profile_id -> user_id)
         ├─ business_availability(business_id)
         ├─ business_services(business_id)
         │  ├─ service_price_options(service_id, business_id)
         │  └─ service_addon_assignments(service_id, addon_id)
         ├─ service_addons(business_id)
         ├─ customers(business_id)
         ├─ bookings(business_id, service_id?, customer_id?)
         │  └─ booking_payments(booking_id UNIQUE, business_id)
         ├─ booking_requests(business_id, service_id?)
         ├─ booking_checkout_sessions(business_id, booking_id?)
         ├─ payment_accounts(business_id)
         ├─ payment_settings(business_id, payment_account_id?)
         └─ quotes(business_id)
```

## Payment behavior context from existing schema

- Free/businesses without payments: supported by `payment_settings.payments_enabled = false` (or missing row).
- Pro with payments: controlled by `payment_settings` and `payment_accounts`.
- Stripe readiness gate already modeled by `payment_accounts.charges_enabled`.

This means payment workflow tables fit the current ownership model without changing tenancy relationships.

## New payment workflow tables (v1)

To keep `bookings` focused and avoid table bloat:

1. `booking_payments` holds one payment summary row per booking.
2. `booking_checkout_sessions` tracks checkout attempts/sessions and carries webhook reconciliation context.

Recommended approach for this product:

- Booking is considered real/confirmed only after successful checkout webhook for online-pay paths.
- Non-payment path (payments disabled) keeps current behavior.
- In-person path can still produce a `booking_payments` row indicating no online charge required.

Detailed docs:

- `src/features/payments/docs/BOOKING_PAYMENTS_TABLE.md`
- `src/features/payments/docs/BOOKING_CHECKOUT_SESSIONS_TABLE.md`

## Notes for future maintainers

- Keep this file updated when schema changes materially.
- Keep feature docs in sync:
  - `src/features/payments/docs/DATABASE.md`
  - `src/features/availability/docs/BOOKINGS_TABLE.md`
- Keep generated/manual Supabase TypeScript types aligned with real schema.
