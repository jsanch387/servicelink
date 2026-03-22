# Availability feature – database

This doc describes the database tables used by the **availability booking** feature. Use it when changing schema, adding tables, or onboarding.

---

## Overview

The feature uses dedicated tables so it stays separate from the existing **booking request** flow. Owners set when they’re available; when “accept bookings” is on, customers can book a specific date and time on the public profile.

---

## Table: `business_availability`

**Purpose:** One row per business. Stores whether the business accepts bookings, minimum notice, weekly working hours, optional **time-off blocks** (specific dates/times when the owner is unavailable), and UI preset metadata.

**Used by:**
- Dashboard **Availability** page (load and save: schedule + time off)
- Public profile booking flow (read-only: schedule, time off, and `accept_bookings` for slot generation)
- Dashboard **Bookings** planner (read-only: time off overlaid on the day timeline)

### Columns

| Column              | Type        | Description |
|---------------------|------------|-------------|
| `id`                 | uuid       | Primary key (auto). |
| `business_id`       | uuid       | FK → `business_profiles(id)`, ON DELETE CASCADE. **Unique** (one row per business). |
| `accept_bookings`   | boolean    | Master toggle. When `true`, public profile can show “Book” and use this schedule. Default `false`. |
| `minimum_notice`    | text       | How far in advance a customer must book. One of: `'none'`, `'1h'`, `'2h'`, `'4h'`, `'24h'`. Default `'none'`. |
| `weekly_schedule`   | jsonb      | Weekly hours. See shape below. Default matches Mon–Fri 9:00–17:00. |
| `selected_preset`   | text       | Which working-hours preset is selected in the UI. One of: `'mon_fri_9_5'`, `'mon_sat_8_6'`, `'weekends_only'`, `'custom'`. Default `'mon_fri_9_5'`. When the user edits any day/time manually, the app sets this to `'custom'`. |
| `time_off_blocks`   | jsonb      | Array of one-off unavailable windows (see **`time_off_blocks` JSONB shape** below). Default `'[]'`. Legacy DBs add via migration. |
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
- **Presets:** The dashboard stores which preset is selected in `selected_preset` so the correct pill (Mon–Fri 9–5, etc.) is shown when loading. When the user changes any time or day manually, the app sets this column to `'custom'`.

### `time_off_blocks` JSONB shape

Array of objects. Each entry is a **calendar date** plus **local wall-clock times** (same “owner local” interpretation as `weekly_schedule`), not UTC instants.

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `id`          | string | yes      | Stable id (UUID string) for list edits and deduplication. |
| `date`        | string | yes      | ISO calendar date `YYYY-MM-DD`. |
| `start_time`  | string | yes      | Start of blocked window, 24h `HH:mm` (minutes are `00` or `30` in the UI). |
| `end_time`    | string | yes      | End of blocked window, 24h `HH:mm`. Overlap logic treats the window as half-open `[start, end)` so a slot starting exactly at `end_time` is still bookable. |
| `title`       | string | no       | Optional note (e.g. “Doctor appointment”). |

Example:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2025-04-22",
    "start_time": "09:00",
    "end_time": "12:00",
    "title": "Doctor appointment"
  }
]
```

- **Constraints:** App validates on save (array length cap, `end` after `start`, date/time formats). A DB `CHECK` may enforce `jsonb_typeof(time_off_blocks) = 'array'`.
- **Usage:** Merged into **public slot generation** and **POST /api/public/bookings** validation so customers cannot book overlapping times. Shown on the owner **Bookings → Planner** day view as visual blocks.

Types in code: `TimeOffBlockStored` / parsing in `types/blockTime.ts`; request validation in `utils/timeOffBlocksPayload.ts`.

### Indexes

- `UNIQUE (business_id)` — one availability row per business and fast lookup by `business_id`.

### Trigger

- **`trigger_business_availability_updated_at`** — before update, sets `updated_at = now()`.

---

## Security and access

- **RLS is enabled** on `business_availability`. Only the business owner can insert, update, or delete their row. Select is allowed for the owner and for rows where `accept_bookings` is true (so the public booking flow can read availability without using the service role).

---

## Related: V2 bookings table

The **availability booking (V2)** flow also uses the `bookings` table: one row per confirmed time slot. That table is documented in [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md). Flow overview (public calendar, time blocking, submit, dashboard) is in [FLOWS.md](./FLOWS.md).

---

## Changelog

- **Time off:** Added `time_off_blocks` (JSONB, default `[]`) for per-date unavailable windows; saved with the same POST `/api/availability` payload as working hours; used in slot generation, booking create validation, and dashboard planner.
- **Initial:** `business_availability` table with `accept_bookings`, `minimum_notice`, `weekly_schedule` (JSONB), timestamps, and `updated_at` trigger.
