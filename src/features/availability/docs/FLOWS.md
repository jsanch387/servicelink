# Availability feature – data flows and workflows

This doc describes how the **owner availability** settings and **V2 (availability) booking** flow work end-to-end: database, APIs, and UI. Use it for context when changing schema, APIs, or the booking flow.

---

## 1. Owner-side availability (dashboard)

**Purpose:** The business owner sets when they are available and whether customers can book exact times (V2) or only submit requests (V1).

### Database

- **Table:** `business_availability`
- **Shape:** One row per business (`business_id` unique). Columns: `accept_bookings`, `minimum_notice`, `weekly_schedule` (JSONB), `selected_preset`, timestamps.
- **`weekly_schedule`:** Keys are day names (`monday` … `sunday`). Each value: `{ "enabled": boolean, "start": "HH:mm", "end": "HH:mm" }` (24-hour).
- **`accept_bookings`:** When `true`, the public profile uses the V2 “Book” flow (calendar + exact slot). When `false`, the public profile uses the V1 “Request booking” flow.

### API

- **GET /api/availability** – Loads the current user’s business availability (auth required). Resolves `business_id` via `business_profiles.profile_id = auth.uid()`.
- **POST /api/availability** – Saves availability (upsert on `business_id`). Body: `accept_bookings`, `minimum_notice`, `weekly_schedule`, `selected_preset`.

### UI / data flow

- Dashboard **Availability** page uses the availability feature store and components. It calls GET on load and POST on save.
- The **Bookings** dashboard page uses `accept_bookings` (from store) to decide whether to show the V2 bookings list or the V1 booking-requests list. V2 list is loaded via GET /api/availability/bookings (see below).

---

## 2. Public V2 booking flow (customer books a time)

**Purpose:** Customer picks a date, then an exact time slot from available slots, fills in details, and submits. One row is created in `bookings`.

### How the public page decides V1 vs V2

- **Route:** `/[business-slug]/book` (e.g. `/johns-plumbing/book`).
- Server loads `business_profiles` by slug and `business_availability` by `business_id` (admin client so RLS doesn’t block).
- If `business_availability.accept_bookings === true` → render **V2** (availability calendar + slot picker). Otherwise → render **V1** (request booking form).
- For V2, the page passes `weeklySchedule`, `serviceDurationMinutes`, `serviceId`, `serviceName`, etc., to the client. Blocked slots are **not** fetched on the server; the client fetches them (see below).

### Time slots: how they are generated

- **Inputs:** Selected date, `weekly_schedule` (from `business_availability`), `serviceDurationMinutes` (from the service or default 60), and **existing bookings** for that business (blocked slots).
- **Source of blocked slots:** **GET /api/public/bookings/blocked/[slug]** returns, for that business, all confirmed/completed bookings with `scheduled_date`, `start_time`, and `duration_minutes`. The client hook `usePublicBlockedSlots(businessSlug)` calls this API and passes the result into the slot generator.
- **Slot generator** (`booking/utils/slotGeneration.ts`):
  - Works in **minutes from midnight** for the selected date.
  - For the selected day, reads `weekly_schedule[day]` (start/end). Only considers times where `start <= slotStart` and `slotStart + serviceDurationMinutes <= end`.
  - Steps in **30-minute** increments. For each candidate slot `[slotStart, slotStart + serviceDurationMinutes]`:
    - Skips if the slot is in the past (when the selected date is today).
    - **Overlap check:** For each existing booking with the same `scheduled_date`, booking range is `[bStart, bStart + b.durationMinutes]`. The slot is **blocked** if `slotStart < bEnd && slotEnd > bStart`. So we block the **full duration** of each existing booking (not just the start time).
  - Returns an array of available start times as `"HH:mm"` strings.

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

### Submitting a booking

- **POST /api/public/bookings** – Public (no auth). Body: `businessSlug`, `businessId`, `serviceId`, `serviceName`, `servicePriceCents`, `durationMinutes`, `scheduledDate` (YYYY-MM-DD), `startTime` (HH:mm), `customer` (name, email, phone, address, notes).
- API resolves business by **slug** (does not trust client `businessId` for authority), then calls `createBooking(adminClient, payload)` from the availability feature. One row is inserted into `bookings` with status `confirmed`. No duplicate-slot check is performed at submit time today; slot blocking is enforced by not showing already-booked times in the UI. (A future improvement could re-check overlap on submit.)

---

## 3. Dashboard: V2 bookings list and status updates

**Purpose:** Owner sees all V2 bookings and can mark them completed or cancel.

### API

- **GET /api/availability/bookings** – Returns V2 bookings for the authenticated user’s business (auth required). Uses RLS (owner can only read own business’s rows). Returns list in display shape (mapped from DB rows).
- **PATCH /api/availability/bookings/[id]** – Updates a booking’s `status` to `completed` or `cancelled` (auth required). RLS ensures only the business owner can update. Body: `{ "status": "completed" }` or `{ "status": "cancelled" }`.

### UI / data flow

- Dashboard **Bookings** page: if `accept_bookings` is on, it renders the V2 view (`AvailabilityBookingsView`), which uses `useAvailabilityBookings()`. The hook calls GET /api/availability/bookings on every visit to the tab so the list is always fresh. Mark complete / cancel update via PATCH and local state only (no refetch). List is grouped into Upcoming / Past / Cancelled.
- Mark as completed or Cancel calls PATCH with the booking id and new status; the hook updates local state (and cache) from the response so no refetch is needed.

---

## 4. Summary: key files and tables

| What | Where |
|------|--------|
| Owner availability table | `business_availability` (see [DATABASE.md](./DATABASE.md)) |
| V2 bookings table | `bookings` (see [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md)) |
| Owner availability API | GET/POST `/api/availability` |
| Public blocked slots (for calendar) | GET `/api/public/bookings/blocked/[slug]` |
| Public create booking | POST `/api/public/bookings` |
| Dashboard list/update bookings | GET `/api/availability/bookings`, PATCH `/api/availability/bookings/[id]` |
| Slot generation (time blocking) | `features/availability/booking/utils/slotGeneration.ts` |
| Blocked slots hook | `features/availability/booking/hooks/usePublicBlockedSlots.ts` |
| Create booking (server) | `features/availability/services/bookingService.ts` (`createBooking`, `listBookingsForBusiness`, `updateBookingStatus`) |

Keeping **time in minutes** everywhere (DB, APIs, slot logic) and converting to hours only in the UI keeps the data model simple and avoids timezone/format issues.
