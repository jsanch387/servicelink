# Bookings table (V2 availability booking) – data design

This doc is a **data/schema brainstorm** for the new `bookings` table. No code yet—just what we store and why, so we can add the table and RLS with a clear picture.

---

## Context

- **V1:** `booking_requests` – customer submits a *request* (preferred date + time window like morning/afternoon); business approves/declines. No exact slot.
- **V2:** Availability booking – business has set working hours; customer picks an **exact date and time** from available slots and submits. We record a **booking** (confirmed slot). This lives in a new table so we don’t mix flows and we can block that slot from future availability.

**When each flow is used:** Public profile checks the business’s `business_availability.accept_bookings`. If off → “Request booking” (V1). If on → “Book” uses the availability flow (V2) and we insert into `bookings`.

---

## What we need to store (one row = one booked slot)

### 1. Business & service

| Column | Type | Why |
|--------|------|-----|
| `business_id` | uuid, FK → business_profiles(id) | Which business. Required for RLS, dashboard, and slot blocking. |
| `service_id` | uuid, FK → business_services(id), nullable | Which service was booked. Nullable in case the service is deleted later; we still keep the booking. |
| `service_name` | text | Name at time of booking (display, emails, history). Denormalized so we don’t depend on service row. |
| `service_price_cents` | integer, nullable | Price at time of booking (receipts, reporting). |
| `duration_minutes` | integer, not null | Length of the slot. Needed to block time, show in dashboard, and for any “end time” logic. |

### 2. The slot (date & time)

| Column | Type | Why |
|--------|------|-----|
| `scheduled_date` | date | Day of the booking (YYYY-MM-DD). |
| `start_time` | time (or text HH:mm) | Start of the slot. With `duration_minutes` we can derive end and block correctly. |
| Optional: `end_time` | time | Can be computed from start + duration; store only if we want to query by end or avoid recomputing. |

Recommendation: store `scheduled_date`, `start_time`, and `duration_minutes`. Derive end when needed (e.g. for slot overlap checks and display).

### 3. Customer (what they submit in the form)

Today the availability flow collects (from `CustomerFormData`):

- Full name  
- Email  
- Phone  
- Street address, unit/apt, city, state, zip  
- Notes  

So we need columns (or a small set of columns) for:

| Column | Type | Notes |
|--------|------|--------|
| `customer_name` | text | Full name. |
| `customer_email` | text | For confirmations and contact. |
| `customer_phone` | text, nullable | |
| `customer_street_address` | text, nullable | |
| `customer_unit_apt` | text, nullable | |
| `customer_city` | text, nullable | |
| `customer_state` | text, nullable | |
| `customer_zip` | text, nullable | |
| `customer_notes` | text, nullable | Free text from the form. |

All customer fields except name/email can be nullable if we later make address optional.

### 4. Status & lifecycle

| Column | Type | Why |
|--------|------|-----|
| `status` | text, check constraint | e.g. `confirmed`, `cancelled`, `completed`. Start with “submit = confirmed”; add cancelled/completed when we support those actions. |
| `created_at` | timestamptz | When the booking was made. |
| `updated_at` | timestamptz | Last change (e.g. status update, or future reschedule). |
| Optional: `confirmed_at` | timestamptz, nullable | When we send a “booking confirmed” email; can add later. |

### 5. Optional but useful

| Column | Type | Why |
|--------|------|-----|
| `business_slug` | text, nullable | Denormalized slug for display/emails (e.g. “Booked at johns-plumbing”) without joining. |
| `cancelled_at` | timestamptz, nullable | When it was cancelled, if we track that. |
| `cancellation_reason` | text, nullable | Optional; for analytics or support. |

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

- **Select:** Business owner can select their rows (`business_id` in their `business_profiles`). No public read (customers don’t query this table directly).
- **Insert:** Only via backend/API when a customer completes the V2 flow (e.g. API validates slot and inserts). So either service role or a policy that allows insert only in a controlled way (e.g. no direct anon insert).
- **Update / Delete:** Only business owner (e.g. cancel, mark completed).

We can spell out exact policies when we add the table.

---

## Summary table (columns to add)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | no | gen_random_uuid() |
| business_id | uuid | no | – |
| business_slug | text | yes | – |
| service_id | uuid | yes | – |
| service_name | text | no | – |
| service_price_cents | integer | yes | – |
| duration_minutes | integer | no | – |
| scheduled_date | date | no | – |
| start_time | time | no | – |
| customer_name | text | no | – |
| customer_email | text | no | – |
| customer_phone | text | yes | – |
| customer_street_address | text | yes | – |
| customer_unit_apt | text | yes | – |
| customer_city | text | yes | – |
| customer_state | text | yes | – |
| customer_zip | text | yes | – |
| customer_notes | text | yes | – |
| status | text | no | 'confirmed' |
| created_at | timestamptz | no | now() |
| updated_at | timestamptz | no | now() |

- **Status:** `confirmed` (default when submitted), `completed`, `cancelled`. Owner can change to completed or cancelled.
- **Cascade:** `business_id` → business_profiles(id) ON DELETE CASCADE (when a business/user data is deleted, their bookings are removed). `service_id` → business_services(id) ON DELETE SET NULL (if service is deleted, booking remains with service_id null).
- Trigger to keep `updated_at` in sync on update.

---

## How it’s used (no code, just flow)

1. **Public profile:** If `business_availability.accept_bookings` is on, “Book” uses V2. We’ll need an API (or server logic) that reads `business_availability` + existing `bookings` for that business to build the calendar and slots.
2. **Slot blocking:** When generating available slots for a date, we load `bookings` for that `business_id` and `scheduled_date` and treat each row as a blocked range `[start_time, start_time + duration_minutes]`. No second booking in that range.
3. **Submit:** Customer submits form → API validates slot is still free → insert one row into `bookings` with all of the above.
4. **Dashboard:** Owner sees “Bookings” (from `bookings`) and “Requests” (from `booking_requests`) separately; we can filter by status and date.

If this shape works for you, next step is the actual `CREATE TABLE` + RLS SQL; we can keep that in a migration file and still no app code until the table exists.
