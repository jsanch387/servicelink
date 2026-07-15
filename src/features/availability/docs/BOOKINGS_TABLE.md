# Bookings table (V2 availability booking)

This doc describes the **`bookings`** table used by the V2 (availability) booking flow: schema, how it’s used for **time blocking**, and **data flow** (APIs, who reads/writes). For end-to-end flows see [FLOWS.md](./FLOWS.md).

---

## Context: V1 vs V2

- **V1:** `booking_requests` – customer submits a _request_ (preferred date + time window); business approves/declines. No exact slot.
- **V2:** Availability booking – business has set working hours; customer picks an **exact date and time** from available slots and submits. We record one row in **`bookings`** (confirmed slot). This table is separate so we don’t mix flows and so we can block that slot from future availability.

**When each flow is used:** Public profile checks `business_availability.accept_bookings`. If off → V1 (request booking). If on → V2 (Book with calendar); we read/write `bookings`.

---

## What we need to store (one row = one booked slot)

### 1. Business & service

| Column                | Type                                       | Why                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `business_id`         | uuid, FK → business_profiles(id)           | Which business. Required for RLS, dashboard, and slot blocking.                                                                                                                                                                                                                                                   |
| `service_id`          | uuid, FK → business_services(id), nullable | Which service was booked. Nullable in case the service is deleted later; we still keep the booking.                                                                                                                                                                                                               |
| `service_name`        | text                                       | Name at time of booking (display, emails, history). Denormalized so we don’t depend on service row.                                                                                                                                                                                                               |
| `service_price_cents` | integer, nullable                          | Price at time of booking (receipts, reporting).                                                                                                                                                                                                                                                                   |
| `duration_minutes`    | integer, not null                          | **Total** length of the booked slot in minutes: **base service time + sum of selected add-on extra minutes** (same value the calendar used when the customer picked the slot). Needed to block time, show in dashboard, emails, and any “end time” logic. Not “service only” when add-ons carried extra duration. |

### 2. The slot (date & time)

| Column               | Type                 | Why                                                                                                |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `scheduled_date`     | date                 | Day of the booking (YYYY-MM-DD).                                                                   |
| `start_time`         | time (or text HH:mm) | Start of the slot. With `duration_minutes` we can derive end and block correctly.                  |
| Optional: `end_time` | time                 | Can be computed from start + duration; store only if we want to query by end or avoid recomputing. |

Recommendation: store `scheduled_date`, `start_time`, and `duration_minutes`. Derive end when needed (e.g. for slot overlap checks and display).

### 3. Customer (what they submit in the form)

Today the availability flow collects (from `CustomerFormData`):

- Full name
- Email
- Phone
- Street address, unit/apt, city, state, zip
- Notes

So we need columns (or a small set of columns) for:

| Column                    | Type           | Notes                          |
| ------------------------- | -------------- | ------------------------------ |
| `customer_name`           | text           | Full name.                     |
| `customer_email`          | text           | For confirmations and contact. |
| `customer_phone`          | text, nullable |                                |
| `customer_street_address` | text, nullable |                                |
| `customer_unit_apt`       | text, nullable |                                |
| `customer_city`           | text, nullable |                                |
| `customer_state`          | text, nullable |                                |
| `customer_zip`            | text, nullable |                                |
| `customer_notes`          | text, nullable | Free text from the form.       |

All customer fields except name/email can be nullable if we later make address optional.

### 4. Status & lifecycle

| Column                   | Type                   | Why                                                                                                                                 |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `status`                 | text, check constraint | e.g. `confirmed`, `cancelled`, `completed`. Start with “submit = confirmed”; add cancelled/completed when we support those actions. |
| `created_at`             | timestamptz            | When the booking was made.                                                                                                          |
| `updated_at`             | timestamptz            | Last change (e.g. status update, or future reschedule).                                                                             |
| Optional: `confirmed_at` | timestamptz, nullable  | When we send a “booking confirmed” email; can add later.                                                                            |

### 5. Optional but useful

| Column                | Type                  | Why                                                                                     |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `business_slug`       | text, nullable        | Denormalized slug for display/emails (e.g. “Booked at johns-plumbing”) without joining. |
| `booking_source`      | text, nullable        | Direct creation origin: `public` booking link or authenticated `owner` flow.            |
| `cancelled_at`        | timestamptz, nullable | When it was cancelled, if we track that.                                                |
| `cancellation_reason` | text, nullable        | Optional; for analytics or support.                                                     |

---

## What we’re not storing (for now)

- Payment – out of scope; can add a separate payments/transactions layer later.
- IP / user_agent / referrer – we can add for abuse or analytics later if needed.
- “Notification sent” – can be a separate table or column when we add emails.

---

## Indexes (for performance)

- **`(business_id, scheduled_date)`** – list a business’s bookings for a day (slot blocking, dashboard “today’s bookings”).
- **`business_id`** – list all bookings for a business (dashboard).
- Optional: **`(business_id, status)`** if we often filter by status.

---

## RLS (high level)

- **Select:** Business owner can select their rows (`business_id` in their `business_profiles`). No public read (customers don’t query this table directly; blocked-slots and create flow use service role / API).
- **Insert:** Only via backend (POST /api/public/bookings uses admin client). No INSERT policy for anon/authenticated; service role inserts.
- **Update / Delete:** Only business owner (e.g. cancel, mark completed) via RLS.

---

## Schema summary (current table)

| Column                  | Type        | Nullable | Default                                                                                                                                                              |
| ----------------------- | ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                      | uuid        | no       | gen_random_uuid()                                                                                                                                                    |
| business_id             | uuid        | no       | –                                                                                                                                                                    |
| business_slug           | text        | yes      | –                                                                                                                                                                    |
| booking_source          | text        | yes      | `public` or `owner`; null for legacy and unrelated system-created bookings.                                                                                          |
| service_id              | uuid        | yes      | –                                                                                                                                                                    |
| service_name            | text        | no       | –                                                                                                                                                                    |
| service_price_cents     | integer     | yes      | –                                                                                                                                                                    |
| addon_details           | jsonb       | yes      | Selected add-ons snapshot; see bullet below                                                                                                                          |
| duration_minutes        | integer     | no       | –                                                                                                                                                                    |
| scheduled_date          | date        | no       | –                                                                                                                                                                    |
| start_time              | time        | no       | –                                                                                                                                                                    |
| customer_name           | text        | no       | –                                                                                                                                                                    |
| customer_email          | text        | no       | –                                                                                                                                                                    |
| customer_phone          | text        | yes      | –                                                                                                                                                                    |
| customer_street_address | text        | yes      | –                                                                                                                                                                    |
| customer_unit_apt       | text        | yes      | –                                                                                                                                                                    |
| customer_city           | text        | yes      | –                                                                                                                                                                    |
| customer_state          | text        | yes      | –                                                                                                                                                                    |
| customer_zip            | text        | yes      | –                                                                                                                                                                    |
| customer_notes          | text        | yes      | –                                                                                                                                                                    |
| customer_id             | uuid        | yes      | FK → `customers(id)` ON DELETE SET NULL; set when booking is created (deduped per business). See `customer-management/docs/migrations/001_bookings_customer_id.sql`. |
| status                  | text        | no       | 'confirmed'                                                                                                                                                          |
| created_at              | timestamptz | no       | now()                                                                                                                                                                |
| updated_at              | timestamptz | no       | now()                                                                                                                                                                |

- **`addon_details`:** JSON array of objects shaped like **`AddOnAtBooking`** (`features/availability/booking/types.ts`): `id`, `name`, `priceCents`, optional **`durationMinutes`** (extra minutes that were included in `duration_minutes` for that add-on, or omitted/null for price-only add-ons). Used for receipts, emails, and customer metrics (e.g. last add-on names). Persisted by **`createBooking`** from **`POST /api/public/bookings`** `selectedAddOns`.
- **`booking_source`:** Set by the server, not trusted from arbitrary client input. `POST /api/public/bookings` stores `owner` only after owner authentication succeeds; otherwise it stores `public`. Stripe checkout completion also stores `public`.
- **Status:** `confirmed` (default when submitted), `completed`, `cancelled`. Owner can change to completed or cancelled.
- **Cascade:** `business_id` → business_profiles(id) ON DELETE CASCADE (when a business/user data is deleted, their bookings are removed). `service_id` → business_services(id) ON DELETE SET NULL (if service is deleted, booking remains with service_id null).
- Trigger to keep `updated_at` in sync on update.

---

## How it’s used: data flow and time blocking

### Time representation

- **Storage:** All times are stored in a form that can be interpreted as minutes or time-of-day: `scheduled_date` (date), `start_time` (time, e.g. 14:00), `duration_minutes` (integer). Slot length is always in **minutes** in the DB and in slot logic; the UI can display duration in hours (e.g. “2 hr”) via a formatter.

### Slot blocking (avoiding double-booking)

- **Source of blocked slots:** **GET /api/public/bookings/blocked/[slug]** returns, for that business, all rows in `bookings` with `status` in `('confirmed', 'completed')`, with fields `scheduled_date`, `start_time`, `duration_minutes`.
- **Overlap rule:** Each existing booking blocks the range **`[start_time, start_time + duration_minutes]`**. When generating available slots for a date, we treat any candidate slot as **blocked** if it overlaps that range (i.e. candidate start &lt; booking end and candidate end &gt; booking start). Implemented in `booking/utils/slotGeneration.ts`. So we block for the **full stored appointment length** (service + add-ons at time of booking), not just the base service length.

### APIs and who writes/reads

| Action                                          | API / layer                               | Who                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| List blocked slots (public calendar)            | GET `/api/public/bookings/blocked/[slug]` | Public; admin client.                                                                                                           |
| Create booking (customer or owner `?for=owner`) | POST `/api/public/bookings`               | Public; resolves business by slug, then `createBooking` (admin), which **upserts `customers`** and sets `bookings.customer_id`. |
| List bookings (dashboard)                       | GET `/api/availability/bookings`          | Authenticated owner; RLS.                                                                                                       |
| Update status (complete/cancel)                 | PATCH `/api/availability/bookings/[id]`   | Authenticated owner; RLS.                                                                                                       |

Insert into `bookings` happens only via the public POST API (no direct anon insert). Select/update/delete are restricted by RLS to the business owner.

### Dashboard

- Owner sees “Bookings” (V2 list from `bookings`) when `accept_bookings` is on, and “Requests” (V1 from `booking_requests`) when off. List is grouped into Upcoming / Past / Cancelled; owner can mark completed or cancel (PATCH above).
