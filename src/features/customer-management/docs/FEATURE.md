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

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `business_id` | `uuid` | FK → `business_profiles(id)`, **required**. Multi-tenant scope. |
| `full_name` | `text` | Required display name. |
| `phone` | `text` | Nullable display phone. |
| `email` | `text` | Nullable display email. |
| `phone_normalized` | `text` | Nullable; digits-only (or E.164) for dedupe on booking submit. |
| `email_normalized` | `text` | Nullable; `lower(trim(email))` for dedupe. |
| `notes` | `text` | Nullable; internal notes (maps to UI `note`). |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Maintain via trigger or app updates. |

**Recommended indexes (dedupe):**

- Unique partial: `(business_id, phone_normalized)` where `phone_normalized` is non-null/non-empty.
- Unique partial: `(business_id, email_normalized)` where `email_normalized` is non-null/non-empty.

**RLS:** Policies should allow the business owner (`business_profiles.profile_id = auth.uid()`) to `select/insert/update/delete` rows where `business_id` matches their profile. Public booking flows that create customers typically use the **service role** / server route, not anon inserts against RLS.

**Related (future):** Link **`bookings`** (or booking requests) to customers with `customer_id` → `customers(id)` so the UI can show real **last service**, **visits**, **revenue**, and **new vs returning**.

---

## TypeScript: generated DB types

App-level Supabase `Database` types live in **`src/libs/supabase/client.ts`**. The `customers` table is declared under `public.Tables.customers` so `from('customers')` is typed in API routes and server code.

Row type alias used in the feature: **`CustomerDbRow`** → `src/features/customer-management/api/customerDbRow.ts`.

---

## UI model: `CustomerRecord`

Defined in **`src/features/customer-management/types.ts`**. Used by list, detail panel, and API JSON.

| Field | Source today | Notes |
|-------|----------------|-------|
| `id`, `name`, `phone`, `email`, `note` | DB | `name` ← `full_name`, `note` ← `notes`. |
| `lastService`, `lastBookingAddOns` | Stub | `lastService` is `—`; add-ons omitted until bookings are joined. |
| `lastBookingDate`, `lastBookingDaysAgo` | Derived | Uses **`created_at`** date only until last booking exists. |
| `totalVisits`, `totalSpent` | Stub | `0` until aggregated from bookings. |
| `status` | Stub | Always `'new'` in mapper until derived from visit count. |

**Stats row** (`CustomerListStats`): Computed in the client from the loaded `CustomerRecord[]` (totals, returning count, revenue sum)—so today revenue/returning match those stubs until real booking data is wired.

---

## API

### `GET /api/customers`

- **File:** `src/app/api/customers/route.ts`.
- **Auth:** Session cookie via `createSupabaseServerClient()`.
- **Steps:** `resolveCurrentBusinessId` → `select * from customers where business_id = … order by created_at desc`.
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

| Area | Role |
|------|------|
| `components/` | Page sections, table, cards, drawer, modal body, skeletons, empty states |
| `hooks/` | `useCustomerManagement` |
| `api/` | Client fetch, response typing, DB row type, `mapCustomerRowToRecord` |
| `server/` | `resolveCurrentBusinessId` (API route support) |
| `constants/` | `CUSTOMER_STATUS_FILTERS` |
| `utils/` | Formatting, search match, date helpers |

**Public exports:** `src/features/customer-management/index.ts` (page, hook, types).

---

## Future work (not implemented)

1. **`customer_id` on `bookings`** (or equivalent) + upsert customer on public booking submit.
2. **Server-side aggregates** or a view for last booking, visit count, spend, `new` vs `returning`.
3. **`DELETE /api/customers/[id]`** (or PATCH) and wire **delete** in the hook to Supabase.
4. **Optimistic UI / revalidation** after mutations (e.g. React Query or `router.refresh()`).

---

*Last updated to match the codebase in this repo; adjust this file when schema or routes change.*
