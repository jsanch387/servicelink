# Customer management feature

Reference for **database shape**, **API**, and **app behavior** for `/dashboard/customers`.

---

## Overview

- **Dashboard route:** `ROUTES.DASHBOARD.CUSTOMERS` → `/dashboard/customers` (`src/app/dashboard/customers/page.tsx`).
- **Data:** Rows come from Supabase table **`public.customers`**, scoped to the signed-in user’s **`business_profiles`** row (`profile_id` = `auth.uid()`).
- **UI:** List (table on desktop, cards on mobile), search + lifecycle filters, detail drawer, send-booking-link modal. List data is loaded client-side via **`GET /api/customers`** after the page mounts.

---

## Database: `public.customers`

Intended schema (create/migrate in Supabase SQL editor or migrations):

| Column             | Type          | Notes                                                           |
| ------------------ | ------------- | --------------------------------------------------------------- |
| `id`               | `uuid`        | Primary key, default `gen_random_uuid()`.                       |
| `business_id`      | `uuid`        | FK → `business_profiles(id)`, **required**. Multi-tenant scope. |
| `full_name`        | `text`        | Required display name.                                          |
| `phone`            | `text`        | Nullable display phone.                                         |
| `email`            | `text`        | Nullable display email.                                         |
| `phone_normalized` | `text`        | Nullable; digits-only (or E.164) for dedupe on booking submit.  |
| `email_normalized` | `text`        | Nullable; `lower(trim(email))` for dedupe.                      |
| `notes`            | `text`        | Nullable; internal notes (maps to UI `note`).                   |
| `created_at`       | `timestamptz` | Default `now()`.                                                |
| `updated_at`       | `timestamptz` | Maintain via trigger or app updates.                            |

**Recommended indexes (dedupe):**

- Unique partial: `(business_id, phone_normalized)` where `phone_normalized` is non-null/non-empty.
- Unique partial: `(business_id, email_normalized)` where `email_normalized` is non-null/non-empty.

**RLS:** Policies should allow the business owner (`business_profiles.profile_id = auth.uid()`) to `select/insert/update/delete` rows where `business_id` matches their profile. Public booking flows that create customers use the **service role** (admin client) inside **`createBooking`**, which bypasses RLS for `customers` insert/select.

**Related:** V2 **`bookings`** rows store **`customer_id`** → `customers(id)` (nullable FK, `ON DELETE SET NULL`). See **`docs/migrations/001_bookings_customer_id.sql`** — run that migration in Supabase before creating bookings in environments where the column is missing.

---

## Customer creation when a V2 booking is confirmed

**Single code path:** There is only one server function that inserts a **`bookings`** row for the availability flow: **`createBooking`** in **`src/features/availability/services/bookingService.ts`**. It is called from **`POST /api/public/bookings`**.

Both of these product flows hit that same endpoint and therefore share customer logic automatically:

| Flow                          | How it reaches `createBooking`                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| **Public profile**            | Customer completes book flow → client `POST /api/public/bookings`.                           |
| **Owner booking for someone** | Dashboard opens book flow with `?for=owner` → same submit → **`POST /api/public/bookings`**. |

There is **no second insert path** for V2 bookings today; if you add another API that inserts into `bookings`, call **`upsertCustomerForBooking`** the same way (or always route through **`createBooking`**).

### Server helpers (this feature)

| File                                     | Role                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`server/normalizeCustomerContact.ts`** | `normalizeEmailForLookup`, `normalizePhoneForLookup` (digits-only phone).                                                                                                                                                  |
| **`server/upsertCustomerForBooking.ts`** | **`upsertCustomerForBooking(supabase, businessId, input)`** — find-or-create `customers` row. Uses a small internal cast for `.from('customers')` until the repo’s `Database` type matches Supabase client generics fully. |

### Dedupe rules

1. Scope: always **`business_id`** (tenant-safe).
2. If **`phone_normalized`** is non-null: look up by `(business_id, phone_normalized)`. If found → return that **`id`**.
3. Else look up by **`(business_id, email_normalized)`** (email is required on the booking form). If found → return **`id`**.
4. Else **insert** a new customer: **`email`** and **`email_normalized`** both set to the normalized address; **`notes`** stays **`null`** (booking form “notes” are **only** on the **`bookings`** row, e.g. access instructions).
5. On unique violation **`23505`** (rare race): re-select by phone then email and return **`id`** if found.

**Note:** We do **not** merge/update an existing customer’s name on match. Profile **`customers.notes`** are for owner-entered customer notes only, not per-booking text.

### Booking row

After **`upsertCustomerForBooking`**, **`createBooking`** sets **`customer_id`** on the inserted **`bookings`** row alongside existing customer snapshot columns (`customer_name`, `customer_email`, etc.).

---

## TypeScript: generated DB types

App-level Supabase `Database` types live in **`src/libs/supabase/client.ts`**. The `customers` table is declared under `public.Tables.customers` so `from('customers')` is typed in API routes and server code.

Row type alias used in the feature: **`CustomerDbRow`** → `src/features/customer-management/api/customerDbRow.ts`.

---

## UI model: `CustomerRecord`

Defined in **`src/features/customer-management/types.ts`**. Used by list, detail panel, and API JSON.

| Field                                                                 | Source today   | Notes                                                                                                                            |
| --------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`, `phone`, `note`                                         | DB             | `name` ← `full_name`, `note` ← `customers.notes` (profile only).                                                                 |
| `email`                                                               | DB             | Shown as **normalized** (`email_normalized` preferred) so the UI has a single canonical address.                                 |
| `lastService`, `lastBookingAddOns`                                    | **`bookings`** | From the **latest `completed`** booking for this `customer_id` (add-on **names** from `addon_details`).                          |
| `lastVisitDate`, `lastVisitDaysAgo`                                   | **`bookings`** | **Last completed** visit calendar date; “days ago” from local midnight.                                                          |
| `nextAppointmentDate`, `nextAppointmentDaysUntil`, `nextAppointment*` | **`bookings`** | **Earliest upcoming `confirmed`** booking whose slot is still in the future (local date + time).                                 |
| `totalVisits`, `totalSpent`                                           | **`bookings`** | **`completed` only:** visit count and sum of **service_price_cents + add-on `priceCents`**. `totalSpent` is dollars in the JSON. |
| `status`                                                              | **`bookings`** | `returning` if more than one **completed** visit, else `new`.                                                                    |
| Fallback (no linked bookings)                                         | Customer row   | visits/spent `0`, schedule fields `null`, last service `—`.                                                                      |

**Stats row** (`CustomerListStats`): Computed in the client from the loaded `CustomerRecord[]` (totals, returning count, revenue sum).

---

## API

### `GET /api/customers`

- **File:** `src/app/api/customers/route.ts`.
- **Auth:** Session cookie via `createSupabaseServerClient()`.
- **Steps:** `resolveCurrentBusinessId` → load **`customers`** for the business → load **`bookings`** with **`customer_id` not null** → **`aggregateBookingsPerCustomer`** → **`mapCustomerRowToRecord(row, metrics)`**.
- **Response (200):** `{ success: true, customers: CustomerRecord[] }` (records are **mapped** server-side).
- **Errors:** `{ success: false, error: string }` with `401` / `404` / `500` as appropriate.

**Client helper:** `fetchCustomersList()` in **`src/features/customer-management/api/fetchCustomers.ts`**  
Uses **`API_ROUTES.CUSTOMERS`** from **`src/constants/routes.ts`** (`/api/customers`).

**Response guard:** `isListCustomersSuccess()` in **`api/listCustomersResponse.ts`**.

**Row → UI mapping:** **`mapCustomerRowToRecord`** in **`api/mapCustomerRowToRecord.ts`**.

---

## Server helper

**`resolveCurrentBusinessId`** — `src/features/customer-management/server/resolveCurrentBusinessId.ts`

- Loads `auth.getUser()`.
- Loads `business_profiles` where `profile_id = user.id`, `select('id').single()`.
- Returns `{ ok: true, businessId }` or `{ ok: false, error, status }`.

Used by the customers GET route (and can be reused for future POST/PATCH/DELETE on this feature).

---

## Frontend behavior

### Hook

**`useCustomerManagement`** — `src/features/customer-management/hooks/useCustomerManagement.ts`

- On mount: `fetchCustomersList()` → sets `customers`, `loadStatus` (`loading` | `ready` | `error`), `loadError`.
- Local state: search query, status filter (`all` | `new` | `returning`), selected customer, send-link modal, SMS template.
- **Delete** (detail panel): Confirms then removes from **local state only**—not persisted to Supabase yet.

### Page & loading

**`CustomerManagementPage`** — composes header, stats, search/filters, table, mobile list, empty states, detail panel, modal.

- **`CustomerManagementPageSkeleton`** — shown while `loadStatus === 'loading'`.
- **`app/dashboard/customers/loading.tsx`** — route-level skeleton for navigation.
- **Empty:** `CustomersInitialEmptyState` when API returns zero rows; `CustomerListEmptyState` when filters/search exclude all rows but some customers exist.
- **Error:** Header + message + **Try again** → `reloadCustomers()`.

### Feature layout (folders)

| Area          | Role                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `components/` | Page sections, table, cards, drawer, modal body, skeletons, empty states                                           |
| `hooks/`      | `useCustomerManagement`                                                                                            |
| `api/`        | Client fetch, response typing, DB row type, `mapCustomerRowToRecord`                                               |
| `server/`     | `resolveCurrentBusinessId`, `normalizeCustomerContact`, `upsertCustomerForBooking`, `aggregateBookingsPerCustomer` |
| `constants/`  | `CUSTOMER_STATUS_FILTERS`                                                                                          |
| `utils/`      | Formatting, search match, date helpers                                                                             |

**Public exports:** `src/features/customer-management/index.ts` (page, hook, types).

---

## Future work (not implemented)

1. **Server-side aggregates** or a view for last booking, visit count, spend, `new` vs `returning` (use **`bookings.customer_id`** + join).
2. **`DELETE /api/customers/[id]`** (or PATCH) and wire **delete** in the hook to Supabase.
3. **Optimistic UI / revalidation** after mutations (e.g. React Query or `router.refresh()`).

---

_Last updated to match the codebase in this repo; adjust this file when schema or routes change._
