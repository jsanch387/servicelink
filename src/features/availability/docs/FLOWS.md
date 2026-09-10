# Availability feature – data flows and workflows

This doc describes how the **owner availability** settings and **V2 (availability) booking** flow work end-to-end: database, APIs, and UI. Use it for context when changing schema, APIs, or the booking flow.

---

## 1. Owner-side availability (dashboard)

**Purpose:** The business owner sets when they are available and whether customers can book exact times (V2) or only submit requests (V1).

### Database

- **Table:** `business_availability`
- **Shape:** One row per business (`business_id` unique). Columns: `accept_bookings`, `minimum_notice`, **`buffer_time`**, `weekly_schedule` (JSONB), `selected_preset`, **`time_off_blocks`** (JSONB array), timestamps.
- **`weekly_schedule`:** Keys are day names (`monday` … `sunday`). Each value: `{ "enabled": boolean, "start": "HH:mm", "end": "HH:mm" }` (24-hour).
- **`time_off_blocks`:** Array of `{ id, date, start_time, end_time, title? }` — specific calendar dates when the owner is unavailable (see [DATABASE.md](./DATABASE.md)). Stored with the same row as working hours; **owner-local** wall times, same semantics as the weekly grid.
- **`minimum_notice`:** Lead time token (how far ahead a **customer** must book). See [DATABASE.md](./DATABASE.md).
- **`buffer_time`:** Gap **between appointments** (not lead time). Stored as a **text token**, not minutes: `'none'`, `'15m'`, `'30m'`, `'45m'`, `'1h'`, `'90m'`, `'2h'`. Default `'none'`. Converted to minutes only when generating or validating slots (`bufferTimeToMinutes` in `utils/bufferTime.ts`: `none`→0, `15m`→15, `30m`→30, `45m`→45, `1h`→60, `90m`→90, `2h`→120). Unknown values → `'none'` / 0.
- **`accept_bookings`:** When `true`, the public profile uses the V2 “Book” flow (calendar + exact slot). When `false`, the public profile uses the V1 “Request booking” flow.

### API

- **GET /api/availability** – Loads the current user’s business availability (auth required). Resolves `business_id` via `business_profiles.profile_id = auth.uid()`. Response is the row (snake_case), including `minimum_notice`, **`buffer_time`**, and `time_off_blocks` when present. No row yet → `data: null` (treat buffer / lead as `'none'`).
- **POST /api/availability** – Saves availability (upsert on `business_id`). **Full-row save:** body must include `acceptBookings`, `schedule`, `minimumNotice`, **`bufferTime`**, `selectedPreset`, **`timeOffBlocks`**. Invalid `bufferTime` / `minimumNotice` → `'none'`. Stored as `buffer_time` / `minimum_notice` / `time_off_blocks`.

### UI / data flow

- Dashboard **Availability** page: tabs **Your schedule** (weekly hours) and **Settings** (**Accept bookings**, **Time off**, **Lead time**, **Buffer time**). All of it persists on **Save availability** (GET on load, POST on save). Buffer and lead are independent: lead hides too-soon customer slots even with no bookings; buffer only applies when another appointment already exists.
- The **Bookings** dashboard page uses `accept_bookings` (from store) to decide whether to show the V2 bookings list or the V1 booking-requests list. V2 list is loaded via GET /api/availability/bookings. The **Planner** layout reads `time_off_blocks` from the server-rendered bookings page and overlays blocks on the day timeline (no separate API).

---

## 2. Public V2 booking flow (customer books a time)

**Purpose:** Customer picks service(s), schedules one visit slot, fills contact/details, and submits. One row is created in `bookings` (single-job or multi-job via `job_details`). Step order and cart rules: **[public-multi-job-booking.md](../../../../docs/contracts/public-multi-job-booking.md)**.

### How the public page decides V1 vs V2

- **Route:** `/[business-slug]/book` (e.g. `/johns-plumbing/book`).
- Server loads `business_profiles` by slug and `business_availability` by `business_id` (admin client so RLS doesn’t block).
- If `business_availability.accept_bookings === true` → render **V2** (service picker → details → visit calendar + slot picker). Otherwise → render **V1** (request booking form).
- For V2, the page passes `weeklySchedule`, **`timeOffBlocks`** (parsed from `time_off_blocks`), **`minimumNotice`**, **`bufferTime`** (the stored token), catalog services, location mode, etc., to the client. Visit duration comes from the session cart (sum of jobs). **Existing booking** blocked slots are fetched client-side (see below); **time off**, **lead time**, and **buffer** come from SSR props (no extra public API).

### Time slots: how they are generated

- **Inputs:** Selected date, `weekly_schedule`, **`time_off_blocks`**, **`minimum_notice`**, **`buffer_time`** (token), **`serviceDurationMinutes` = total appointment length in minutes**, and **existing bookings** for that business.
  - **Important:** On `AvailabilityBookingPage`, the value passed into `DateSelector` / `TimeSlotGrid` is **`totalBookingDurationMinutes`**: base service duration (from `business_services`, with legacy fallback—see below) **plus** the sum of each selected add-on’s `duration_minutes` (only minutes &gt; 0 count). With no add-ons, that equals the base service duration only.
- **Source of booking-occupied slots:** **GET /api/public/bookings/blocked/[slug]** returns confirmed/completed bookings with `scheduled_date`, `start_time`, and `duration_minutes`. The hook `usePublicBlockedSlots(businessSlug)` merges that into the slot generator.
- **Source of owner time off:** Parsed on the **server** when rendering `/[slug]/book` (admin client loads `business_availability`). No extra public API for time off.
- **Slot generator** (`booking/utils/slotGeneration.ts`):
  - Works in **minutes from midnight** for the selected date.
  - For the selected day, reads `weekly_schedule[day]` (start/end). Only considers times where `start <= slotStart` and `slotStart + duration <= end`, where **duration** is the **total** appointment minutes passed in (prop name in code is often `serviceDurationMinutes` but the value is **base + add-ons** when applicable).
  - Steps in **30-minute** increments. For each candidate slot `[slotStart, slotStart + duration]`:
    - Skips if the slot is in the past (when the selected date is today).
    - **Lead time** (`minimum_notice`): customers must book at least that far ahead. **Owners skip lead time** (dashboard create / reschedule). Independent of buffer.
    - **Bookings overlap + buffer:** For each existing booking on that `scheduled_date`, range `[bStart, bStart + duration]`. With **`buffer_time`**, require that gap on **both sides** of the existing job: block if `slotStart < bEnd + buffer && slotEnd + buffer > bStart`. Example: job **8:00–9:30**, buffer `30m` → first legal start **10:00**; buffer `1h` → first legal start **10:30**. Buffer is **0** when the token is `'none'` or there are **no** existing bookings. **Applies to customers and owners** (unlike lead time).
    - **Time-off overlap:** For each `time_off_blocks` entry whose inclusive `start_date`–`end_date` covers the calendar day: all-day blocks remove the whole day; timed blocks use `[offStart, offEnd)` (half-open) and the same window applies on each day in a multi-day range.
  - **`bookingOverlapsTimeOff`** is reused by **POST /api/public/bookings** to reject creates that fall inside a block (HTTP 409), even if the client is tampered with.
  - Returns available start times as `"HH:mm"` strings.

So: **appointment length** is handled in minutes (storage and overlap logic). The UI can display duration in hours (e.g. “2 hr”) via a formatter. **`buffer_time` / `minimum_notice` stay tokens** until `bufferTimeToMinutes` / lead-time helpers convert them for that overlap pass.

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
- **Public booking path (current):** Customer picks a service on **`/[slug]/book`**, configures price + add-ons on **`/[slug]/book/details`** (`ServiceDetailsScreen` — one combined details phase; add-ons reveal after a pricing option when multi-price is on), then continues into the **visit** calendar at **`/[slug]/book?visit=1`** (session cart). Multi-job: see **[public-multi-job-booking.md](../../../../docs/contracts/public-multi-job-booking.md)**.
- **Totals on the client:** **`totalBookingDurationMinutes`** = sum of job durations (service + selected add-ons per job). Same value drives slot generation, quick “next available”, and submit.
- **Submit payload:** Either legacy single-job fields (`serviceId`, `durationMinutes`, `selectedAddOns`, …) or **`jobs[]`** for multi-job. Stored as **`addon_details`** / **`job_details`** (see [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md)).
- **Server note:** The API validates **`durationMinutes`** (or summed job durations) as a positive number and uses it for time-off overlap; it does **not** currently recompute duration from catalog rows in the database (trust the client for normal UI flow).

#### Service & add-on duration pickers (30-minute grid)

- **Services** (dashboard edit, onboarding Step 2) and **add-ons** (optional extra time) use **`TimeSelect` `variant="duration"`** with validation from **`features/availability/utils/timeOptions.ts`**: **30 minutes through 10 hours 30 minutes**, **:00** or **:30** only (`isValidServiceDurationHHmm`, `serviceDurationHHmmToMinutes`). Add-on optional duration parsing: **`features/services/utils/addOnDurationForm.ts`** (empty = no extra time).

### Submitting a booking

- **POST /api/public/bookings** – Public (no auth). Body: `businessSlug`, plus either single-job fields or **`jobs[]`**, `scheduledDate` (YYYY-MM-DD), `startTime` (HH:mm), `customer` (name, email, phone, address when mobile, notes).
- API resolves business by **slug**. For **customer** bookings it loads **`time_off_blocks`** / **`minimum_notice`** / **`buffer_time`** and **rejects** with **409** on time-off overlap (single day, date range, all-day, or timed) or lead-time violations. **Owner manual booking** (`ownerManualBooking: true`, authenticated) skips time-off and lead-time so owners can schedule outside those rules.
  - **Existing booking overlap + buffer** is re-checked on submit for customers **and** owners (HTTP 409), including owner reschedule (`validateOwnerBookingSlot`). Buffer token → minutes via `bufferTimeToMinutes`.
  - Then calls `createBooking(adminClient, payload)`, which **upserts** a `customers` row (dedupe by phone then email per business), sets **`bookings.customer_id`**, upserts **`customer_assets`** for complete vehicles, and inserts the booking with status `confirmed`.
- **Paid path:** `POST /api/public/booking-checkout` stores the payload; Stripe webhook calls the same `createBooking`.

#### Service location on the business profile

Businesses store **`service_location_mode`** (`mobile_only` | `shop_only` | `both`) and a **physical shop address** (`shop_street_address`, `shop_unit`, `shop_city`, `shop_state`, `shop_zip`) separately from the **mobile serving area** (`service_area`, `business_zip`, primary `business_service_areas`). Details edits coverage; Booking edits shop. Do not reuse serving city/state/ZIP for the shop.

The public book flow branches on mode: **mobile** collects customer address on the **contact** step (same screen as name/phone); **shop** shows the business shop address and prefills it on submit; **both** asks **mobile vs shop on `/book/details`** (after price / add-ons when those exist), then schedule. APIs validate rules server-side. Full schema, validation, and file map: **[serviceLocation.md](../../business-profile/docs/serviceLocation.md)**.

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

### Day-before reminders

See **[`src/features/cron/docs/README.md`](../../../cron/docs/README.md)** for what a cron job is and how Vercel calls this one.

- **GET `/api/internal/cron/booking-reminders`** (daily 14:00 UTC) finds `confirmed` bookings whose `scheduled_date` is **tomorrow** in `America/Chicago`.
- **Owner:** one inbox row + Expo push: title **Upcoming appointment**, body **You have an appointment coming up.** Tap is `screen` → `bookings`.
- **Customer:** email if we have an address; SMS if we have a phone (logged to `sms_messages` as `booking_reminder` so it shows in the owner message inbox). Missing contact = skip that channel. SMS uses the same opt-in / eligibility gates as confirmation texts.
- Owner idempotency: `notifications.dedupe_key` = `booking_reminder:{profileId}:{targetDate}`. Customer SMS: `{bookingId}:booking_reminder:{scheduledDate}`.

---

## 4. Summary: key files and tables

| What                                                             | Where                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Owner availability table                                         | `business_availability` (see [DATABASE.md](./DATABASE.md)) — includes `time_off_blocks`, `minimum_notice`, `buffer_time` |
| V2 bookings table                                                | `bookings` (see [BOOKINGS_TABLE.md](./BOOKINGS_TABLE.md))                                                                |
| Owner availability API                                           | GET/POST `/api/availability` (body: `timeOffBlocks`, `minimumNotice`, `bufferTime`)                                      |
| Buffer time tokens → minutes                                     | `utils/bufferTime.ts` (`bufferTimeToMinutes`, `resolveBufferTimeValue`)                                                  |
| Lead time tokens → minutes                                       | `utils/minimumNotice.ts`                                                                                                 |
| Time-off parse/validate                                          | `types/blockTime.ts`, `utils/timeOffBlocksPayload.ts`                                                                    |
| Public blocked slots (bookings only)                             | GET `/api/public/bookings/blocked/[slug]`                                                                                |
| Public create booking                                            | POST `/api/public/bookings` (validates vs `time_off_blocks`, lead time, existing bookings + buffer)                      |
| Dashboard list/update bookings                                   | GET `/api/availability/bookings`, PATCH `/api/availability/bookings/[id]`                                                |
| Slot generation (schedule + bookings + time off + lead + buffer) | `features/availability/booking/utils/slotGeneration.ts`                                                                  |
| Owner slot re-check (reschedule)                                 | `features/availability/booking/server/validateOwnerBookingSlot.ts`                                                       |
| Price/duration breakdown (calendar + review step)                | `features/availability/booking/components/BookingPriceBreakdown.tsx`                                                     |
| Service + add-ons for booking (server)                           | `features/services/api/getServiceWithAddOnsForBooking.ts`, `getAddOnsByIdsForBooking.ts`                                 |
| Blocked slots hook                                               | `features/availability/booking/hooks/usePublicBlockedSlots.ts`                                                           |
| Planner time-off overlay                                         | `features/availability/booking/dashboard/DayPlannerView.tsx`                                                             |
| Create booking (server)                                          | `features/availability/services/bookingService.ts` (`createBooking`, `listBookingsForBusiness`, `updateBookingStatus`)   |
| Day-before reminders                                             | `booking/server/reminders` + cron feature                                                                                |
| Business service location (mobile/shop/both)                     | `business_profiles` columns + [serviceLocation.md](../../business-profile/docs/serviceLocation.md)                       |

Keeping **appointment length in minutes** (DB `duration_minutes`, slot overlap) and converting to human-readable duration only in the UI (`formatDurationMinutes`, etc.) keeps the data model simple. **Booked slot length** is always the **total** minutes (service + selected add-on time). **`buffer_time` and `minimum_notice` stay as text tokens** on `business_availability`; they become minutes only inside slot generation and create/reschedule validation.
