# Availability feature – data flows and workflows

This doc describes how the **owner availability** settings and **V2 (availability) booking** flow work end-to-end: database, APIs, and UI. Use it for context when changing schema, APIs, or the booking flow.

---

## 1. Owner-side availability (dashboard)

**Purpose:** The business owner sets when they are available and whether customers can book exact times (V2) or only submit requests (V1).

### Database

- **Table:** `business_availability`
- **Shape:** One row per business (`business_id` unique). Columns: `accept_bookings`, `minimum_notice`, `weekly_schedule` (JSONB), `selected_preset`, **`time_off_blocks`** (JSONB array), timestamps.
- **`weekly_schedule`:** Keys are day names (`monday` … `sunday`). Each value: `{ "enabled": boolean, "start": "HH:mm", "end": "HH:mm" }` (24-hour).
- **`time_off_blocks`:** Array of `{ id, date, start_time, end_time, title? }` — specific calendar dates when the owner is unavailable (see [DATABASE.md](./DATABASE.md)). Stored with the same row as working hours; **owner-local** wall times, same semantics as the weekly grid.
- **`accept_bookings`:** When `true`, the public profile uses the V2 “Book” flow (calendar + exact slot). When `false`, the public profile uses the V1 “Request booking” flow.

### API

- **GET /api/availability** – Loads the current user’s business availability (auth required). Resolves `business_id` via `business_profiles.profile_id = auth.uid()`. Response includes `time_off_blocks` when present.
- **POST /api/availability** – Saves availability (upsert on `business_id`). Body: `acceptBookings`, `minimumNotice`, `schedule`, `selectedPreset`, **`timeOffBlocks`** (camelCase array; validated server-side and stored as `time_off_blocks`).

### UI / data flow

- Dashboard **Availability** page: working hours + **Time off** section (add/remove blocks in UI; persisted on **Save availability** with the rest of the row). Uses GET on load and POST on save.
- The **Bookings** dashboard page uses `accept_bookings` (from store) to decide whether to show the V2 bookings list or the V1 booking-requests list. V2 list is loaded via GET /api/availability/bookings. The **Planner** layout reads `time_off_blocks` from the server-rendered bookings page and overlays blocks on the day timeline (no separate API).

---

## 2. Public V2 booking flow (customer books a time)

**Purpose:** Customer picks a date, then an exact time slot from available slots, fills in details, and submits. One row is created in `bookings`.

### How the public page decides V1 vs V2

- **Route:** `/[business-slug]/book` (e.g. `/johns-plumbing/book`).
- Server loads `business_profiles` by slug and `business_availability` by `business_id` (admin client so RLS doesn’t block).
- If `business_availability.accept_bookings === true` → render **V2** (availability calendar + slot picker). Otherwise → render **V1** (request booking form).
- For V2, the page passes `weeklySchedule`, **`timeOffBlocks`** (parsed from `time_off_blocks`), `serviceDurationMinutes`, `serviceId`, `serviceName`, etc., to the client. **Existing booking** blocked slots are fetched client-side (see below); **time off** is already on the props from SSR.

### Time slots: how they are generated

- **Inputs:** Selected date, `weekly_schedule`, **`time_off_blocks`** (as `timeOffBlocks` on the client), **`serviceDurationMinutes` = total appointment length in minutes**, and **existing bookings** for that business.
  - **Important:** On `AvailabilityBookingPage`, the value passed into `DateSelector` / `TimeSlotGrid` is **`totalBookingDurationMinutes`**: base service duration (from `business_services`, with legacy fallback—see below) **plus** the sum of each selected add-on’s `duration_minutes` (only minutes &gt; 0 count). With no add-ons, that equals the base service duration only.
- **Source of booking-occupied slots:** **GET /api/public/bookings/blocked/[slug]** returns confirmed/completed bookings with `scheduled_date`, `start_time`, and `duration_minutes`. The hook `usePublicBlockedSlots(businessSlug)` merges that into the slot generator.
- **Source of owner time off:** Parsed on the **server** when rendering `/[slug]/book` (admin client loads `business_availability`). No extra public API for time off.
- **Slot generator** (`booking/utils/slotGeneration.ts`):
  - Works in **minutes from midnight** for the selected date.
  - For the selected day, reads `weekly_schedule[day]` (start/end). Only considers times where `start <= slotStart` and `slotStart + duration <= end`, where **duration** is the **total** appointment minutes passed in (prop name in code is often `serviceDurationMinutes` but the value is **base + add-ons** when applicable).
  - Steps in **30-minute** increments. For each candidate slot `[slotStart, slotStart + duration]`:
    - Skips if the slot is in the past (when the selected date is today).
    - **Bookings overlap:** For each existing booking on that `scheduled_date`, range `[bStart, bStart + duration]`. Block if `slotStart < bEnd && slotEnd > bStart`.
    - **Time-off overlap:** For each `time_off_blocks` entry on that calendar `date`, range `[offStart, offEnd)` (half-open). Block if the slot overlaps the same way (`slotStart < offEnd && slotEnd > offStart`).
  - **`bookingOverlapsTimeOff`** is reused by **POST /api/public/bookings** to reject creates that fall inside a block (HTTP 409), even if the client is tampered with.
  - Returns available start times as `"HH:mm"` strings.

So: **time is handled in minutes** (storage and overlap logic). The UI can display duration in hours (e.g. “2 hr”) via a formatter; the underlying logic stays in minutes.

#### Service duration: `duration_minutes` vs legacy `hours_to_complete`

- **Database:** `business_services` has:
  - `duration_minutes INT NULL` – preferred going forward.
  - `hours_to_complete NUMERIC NULL` – legacy field kept for backward compatibility.
- **Writing duration (new flow):**
  - **Onboarding V2 Step 2** and any new availability-based flows write **only** `duration_minutes` (in minutes, e.g. 90 for 1.5 hours).
  - Legacy service-creation/editing flows may still write `hours_to_complete`; these rows will continue to work.
- **Reading duration for display (service cards):**
  - In `BusinessProfileView → ServicesList → ServiceCard`:
    - If `duration_minutes` is present and > 0, we compute `hours = duration_minutes / 60` and display that in the UI (e.g. “2 Hours”), using a formatter.
    - If `duration_minutes` is null but `hours_to_complete` is present, we display `hours_to_complete` instead (legacy behavior).
    - If neither is present, no duration badge is shown.
- **Reading duration for booking (public `/[business-slug]/book`):**
  - The server fetches the selected service and derives `serviceDurationMinutes` as:
    - If `duration_minutes` is present → use it directly, with a minimum of 15 minutes.
    - Else if `hours_to_complete` is present → convert to minutes (`hours_to_complete * 60`), with a minimum of 15 minutes.
    - Else → default to 60 minutes.
  - That `serviceDurationMinutes` is passed into `AvailabilityBookingPage` and used for:
    - Time-slot generation (slot length in minutes).
    - Display (via `formatDurationMinutes`).
    - The booking payload (`durationMinutes` in `POST /api/public/bookings`).

In short: **we always prioritize `duration_minutes` when present**, but gracefully fall back to `hours_to_complete` so older services and bookings continue to behave correctly. All booking logic runs in minutes; hours are now only a presentation concern.

#### Add-on optional duration (`service_addons.duration_minutes`)

- **Database:** `service_addons` may include **`duration_minutes`** (nullable). Empty/null means the add-on does **not** extend the appointment length (price-only add-on).
- **Public booking path:** Customer picks a service on **`/[slug]/book/details`** (`ServiceDetailsScreen`), optionally toggles add-ons, then continues to **`/[slug]/book?serviceId=…&addOnIds=…`**. The book page resolves add-on IDs with **`getAddOnsByIdsForBooking`** (scoped by `business_id`) and passes full add-on objects (including `duration_minutes`) into **`AvailabilityBookingPage`**.
- **Totals on the client:** **`totalBookingDurationMinutes`** = base `serviceDurationMinutes` + Σ add-on minutes (ignore null/0). Same value drives the **price breakdown** (`BookingPriceBreakdown`), slot generation, and submit payload.
- **Submit payload:** **`durationMinutes`** must be that **total** length. Optional **`selectedAddOns`**: `{ id, name, priceCents, durationMinutes? }[]` — stored on the booking as **`addon_details`** (see [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md)).
- **Server note:** The API validates **`durationMinutes`** as a positive number and uses it for time-off overlap; it does **not** currently recompute duration from `serviceId` + add-on rows in the database (trust the client for normal UI flow).

#### Service & add-on duration pickers (30-minute grid)

- **Services** (dashboard edit, onboarding Step 2) and **add-ons** (optional extra time) use **`TimeSelect` `variant="duration"`** with validation from **`features/availability/utils/timeOptions.ts`**: **30 minutes through 10 hours 30 minutes**, **:00** or **:30** only (`isValidServiceDurationHHmm`, `serviceDurationHHmmToMinutes`). Add-on optional duration parsing: **`features/services/utils/addOnDurationForm.ts`** (empty = no extra time).

### Submitting a booking

- **POST /api/public/bookings** – Public (no auth). Body: `businessSlug`, `businessId`, `serviceId`, `serviceName`, `servicePriceCents`, **`durationMinutes`** (total appointment minutes), **`selectedAddOns`** (optional), `scheduledDate` (YYYY-MM-DD), `startTime` (HH:mm), `customer` (name, email, phone, address, notes).
- API resolves business by **slug**, loads **`time_off_blocks`** from `business_availability`, and **rejects** the request with **409** if the requested window overlaps any time-off block for that date.
  - Then calls `createBooking(adminClient, payload)`, which **upserts** a `customers` row (dedupe by phone then email per business), sets **`bookings.customer_id`**, and inserts the booking with status `confirmed`. Overlap with **other bookings** is not re-checked at submit time today (UI + blocked-slots API reduce double-booking; a future improvement could add a server-side booking overlap check).

---

## 3. Dashboard: V2 bookings list and status updates

**Purpose:** Owner sees all V2 bookings and can mark them completed or cancel.

### API

- **GET /api/availability/bookings** – Returns V2 bookings for the authenticated user’s business (auth required). Uses RLS (owner can only read own business’s rows). Returns list in display shape (mapped from DB rows).
- **PATCH /api/availability/bookings/[id]** – Updates a booking’s `status` to `completed` or `cancelled` (auth required). RLS ensures only the business owner can update. Body: `{ "status": "completed" }` or `{ "status": "cancelled" }`.

### UI / data flow

- Dashboard **Bookings** page: if `accept_bookings` is on, it renders the V2 view (`AvailabilityBookingsView`), which uses `useAvailabilityBookings()`. The hook calls GET /api/availability/bookings on every visit to the tab so the list is always fresh. Mark complete / cancel update via PATCH and local state only (no refetch). List is grouped into Upcoming / Past / Cancelled.
- **Planner** mode: the page server-loads **`time_off_blocks`** and passes them into `DayPlannerView`. Time-off windows render as non-interactive blocks on the day timeline (alongside appointment cards). Reload the page after editing time off on **Availability** to refresh planner data.
- Mark as completed or Cancel calls PATCH with the booking id and new status; the hook updates local state (and cache) from the response so no refetch is needed.

---

## 4. Summary: key files and tables

| What                                              | Where                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Owner availability table                          | `business_availability` (see [DATABASE.md](./DATABASE.md)) — includes `time_off_blocks`                                |
| V2 bookings table                                 | `bookings` (see [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md))                                                              |
| Owner availability API                            | GET/POST `/api/availability` (body includes `timeOffBlocks`)                                                           |
| Time-off parse/validate                           | `types/blockTime.ts`, `utils/timeOffBlocksPayload.ts`                                                                  |
| Public blocked slots (bookings only)              | GET `/api/public/bookings/blocked/[slug]`                                                                              |
| Public create booking                             | POST `/api/public/bookings` (validates vs `time_off_blocks`)                                                           |
| Dashboard list/update bookings                    | GET `/api/availability/bookings`, PATCH `/api/availability/bookings/[id]`                                              |
| Slot generation (schedule + bookings + time off)  | `features/availability/booking/utils/slotGeneration.ts`                                                                |
| Price/duration breakdown (calendar + review step) | `features/availability/booking/components/BookingPriceBreakdown.tsx`                                                   |
| Service + add-ons for booking (server)            | `features/services/api/getServiceWithAddOnsForBooking.ts`, `getAddOnsByIdsForBooking.ts`                               |
| Blocked slots hook                                | `features/availability/booking/hooks/usePublicBlockedSlots.ts`                                                         |
| Planner time-off overlay                          | `features/availability/booking/dashboard/DayPlannerView.tsx`                                                           |
| Create booking (server)                           | `features/availability/services/bookingService.ts` (`createBooking`, `listBookingsForBusiness`, `updateBookingStatus`) |

Keeping **time in minutes** everywhere (DB, APIs, slot logic) and converting to human-readable duration only in the UI (`formatDurationMinutes`, etc.) keeps the data model simple and avoids timezone/format issues. **Booked slot length** is always the **total** minutes (service + selected add-on time).
