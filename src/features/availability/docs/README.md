# Availability feature – docs

Documentation for the **availability** feature: owner-side availability settings and **V2 (availability) booking** flow. Use these for DB structure, data flow, and context when changing the feature.

| Doc | Description |
|-----|-------------|
| [FLOWS.md](./FLOWS.md) | **Start here.** End-to-end flows: owner availability (dashboard + API + DB), public V2 booking (calendar, time blocking, submit), dashboard bookings list/update. Time blocking and key files. |
| [DATABASE.md](./DATABASE.md) | Table `business_availability`: columns, `weekly_schedule` JSONB shape, indexes, triggers, RLS. Owner availability only. |
| [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md) | Table `bookings` (V2): schema, columns, indexes, RLS. How it’s used for slot blocking and dashboard. |

Add new docs here as the feature grows. Keep content factual and avoid secrets or sensitive security details.
