# Availability feature – docs

Documentation for the **availability** feature: owner-side availability settings and **V2 (availability) booking** flow. Use these for DB structure, data flow, and context when changing the feature.

| Doc | Description |
|-----|-------------|
| [FLOWS.md](./FLOWS.md) | **Start here.** End-to-end flows: owner availability (dashboard + API + DB), **time off blocks**, public V2 booking (calendar, slot generation, submit), **service + add-on durations and total appointment minutes**, dashboard bookings list/planner. Key files. |
| [DATABASE.md](./DATABASE.md) | Table `business_availability`: columns, `weekly_schedule` and **`time_off_blocks`** JSONB shapes, indexes, triggers, RLS. |
| [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md) | Table `bookings` (V2): schema, columns, indexes, RLS. How it’s used for slot blocking and dashboard. |
| [Payments: booking checkout](../../payments/docs/BOOKING_CHECKOUT_FLOW.md) | **Card checkout path:** Stripe Connect, `booking_checkout_sessions`, webhook → `bookings` + `booking_payments`, return UI, emails (lives under `features/payments/docs`). |

Add new docs here as the feature grows. Keep content factual and avoid secrets or sensitive security details.
