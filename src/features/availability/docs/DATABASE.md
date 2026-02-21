# Availability feature – database

This doc describes the database tables used by the **availability booking** feature. Use it when changing schema, adding tables, or onboarding.

---

## Overview

The feature uses dedicated tables so it stays separate from the existing **booking request** flow. Owners set when they’re available; when “accept bookings” is on, customers can book a specific date and time on the public profile.

---

## Table: `business_availability`

**Purpose:** One row per business. Stores whether the business accepts bookings, minimum notice, and the weekly schedule (which days and times they’re available).

**Used by:**
- Dashboard **Availability** page (load and save)
- Public profile booking flow (read-only when deciding if booking is allowed and which slots to show)

### Columns

| Column              | Type        | Description |
|---------------------|------------|-------------|
| `id`                 | uuid       | Primary key (auto). |
| `business_id`       | uuid       | FK → `business_profiles(id)`, ON DELETE CASCADE. **Unique** (one row per business). |
| `accept_bookings`   | boolean    | Master toggle. When `true`, public profile can show “Book” and use this schedule. Default `false`. |
| `minimum_notice`    | text       | How far in advance a customer must book. One of: `'none'`, `'1h'`, `'2h'`, `'4h'`, `'24h'`. Default `'none'`. |
| `weekly_schedule`   | jsonb      | Weekly hours. See shape below. Default matches Mon–Fri 9:00–17:00. |
| `selected_preset`   | text       | Which working-hours preset is selected in the UI. One of: `'mon_fri_9_5'`, `'mon_sat_8_6'`, `'weekends_only'`, `'custom'`. Default `'mon_fri_9_5'`. When the user edits any day/time manually, the app sets this to `'custom'`. |
| `created_at`        | timestamptz | Set on insert. |
| `updated_at`        | timestamptz | Set on insert and on every update (via trigger). Use for “Last updated” in the UI. |

### `weekly_schedule` JSONB shape

Same structure as the feature type `WeeklySchedule` in `types/availability.ts`:

- **Keys:** `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
- **Per day:** `{ "enabled": boolean, "start": "HH:mm", "end": "HH:mm" }` (24-hour)

Example:

```json
{
  "monday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
  "tuesday":   { "enabled": true,  "start": "09:00", "end": "17:00" },
  "wednesday": { "enabled": true,  "start": "09:00", "end": "17:00" },
  "thursday":  { "enabled": true,  "start": "09:00", "end": "17:00" },
  "friday":    { "enabled": true,  "start": "09:00", "end": "17:00" },
  "saturday":  { "enabled": false, "start": "09:00", "end": "17:00" },
  "sunday":    { "enabled": false, "start": "09:00", "end": "17:00" }
}
```

- **Constraints:** None at DB level; validate in app (e.g. `start` &lt; `end`, valid `HH:mm`).
- **Presets:** The dashboard stores which preset is selected in `selected_preset` so the correct pill (Mon–Fri 9–5, etc.) is shown when loading. When the user changes any time or day manually, the app sets `selected_preset` to `'custom'`.

### Indexes

- `UNIQUE (business_id)` — one availability row per business and fast lookup by `business_id`.

### Trigger

- **`trigger_business_availability_updated_at`** — before update, sets `updated_at = now()`.

---

## Security and access

- **RLS is enabled** on `business_availability`. Only the business owner can insert, update, or delete their row. Select is allowed for the owner and for rows where `accept_bookings` is true (so the public booking flow can read availability without using the service role).

---

## Changelog

- **Initial:** `business_availability` table with `accept_bookings`, `minimum_notice`, `weekly_schedule` (JSONB), timestamps, and `updated_at` trigger.
