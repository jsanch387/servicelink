# Services Feature

This feature handles **managing business services** for the dashboard: listing, creating, editing, deleting, toggling visibility, and reordering. Services are stored in the `business_services` table and displayed on the public profile and in the business profile view.

---

## Overview

- **Dashboard entry point:** `/dashboard/services` — server-rendered page that loads services and renders `ServicesContent`.
- **Data source:** Supabase `business_services` table, keyed by `business_id`.
- **Auth & context:** All mutations use the current user and resolve the business via `getOnboardingState(user.id)`. Read path on the dashboard also requires onboarding completed.

---

## Feature Structure

```
src/features/services/
├── README.md                 # This file
├── index.ts                  # Public exports (actions, getServices, components, types)
├── categories/               # Service categories — see categories/README.md
│   ├── README.md
│   ├── api/                  # getServiceCategories, CRUD, reorder
│   ├── actions/
│   └── utils/                # sortServicesForDisplay, filter pills
├── types/
│   └── services.ts           # ServiceRow, payloads, result types
├── api/                       # Server-only DB layer (no auth)
│   ├── getServices.ts        # Fetch services for a business (ordered)
│   ├── createService.ts      # Insert one service
│   ├── updateService.ts      # Update name, description, price, duration
│   ├── deleteService.ts      # Delete one service
│   ├── updateServiceIsActive.ts   # Toggle is_active
│   └── updateServicesOrder.ts     # Persist sort_order for a list of ids
├── actions/                   # Next.js Server Actions (auth + business resolution)
│   ├── createService.ts
│   ├── updateService.ts
│   ├── deleteService.ts
│   ├── updateServiceIsActive.ts
│   └── saveServicesOrder.ts
└── components/
    ├── ServicesContent.tsx       # Main dashboard UI (list, add, edit, delete, reorder, toggle)
    ├── ServiceManagementCard.tsx # Single service card with actions
    ├── EditServiceModal.tsx      # Add/Edit service form
    └── ServicesLoadingSkeleton.tsx # Loading state for the page
```

- **`api/`** — Pure data layer: accept `supabase` and `businessId` (or ids), run queries. Used by `actions/` or server routes. No auth.
- **`actions/`** — Server Actions callable from the client. They get the current user, resolve business via `getOnboardingState`, then call the corresponding `api/` function.
- **`types/`** — Single place for `ServiceRow` and all payload/result types used by this feature.

---

## Data Model

**Table:** `business_services`

| Column              | Purpose                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | UUID, primary key                                                                                                                                                                                                             |
| `business_id`       | FK to business (scope for all queries)                                                                                                                                                                                        |
| `name`              | Service name                                                                                                                                                                                                                  |
| `description`       | Optional text                                                                                                                                                                                                                 |
| `price_cents`       | Nullable (e.g. “Contact for quote”)                                                                                                                                                                                           |
| `duration_minutes`  | Nullable; **appointment length in minutes** for V2 booking (slot generation, `bookings.duration_minutes` when no add-on time). UI pickers use **30-minute steps** from 30m through 10h 30m (`TimeSelect` + `timeOptions.ts`). |
| `hours_to_complete` | Legacy; prefer `duration_minutes` (still read as fallback on public book page)                                                                                                                                                |
| `is_active`         | If false, hidden on public profile                                                                                                                                                                                            |
| `category_id`       | Nullable FK → `service_categories.id`; `ON DELETE SET NULL`                                                                                                                                                                   |
| `sort_order`        | Integer; display order **within the service’s category bucket** (or flat list when no categories). Null until user reorders                                                                                                   |
| `created_at`        | Set on insert                                                                                                                                                                                                                 |
| `updated_at`        | Set on update                                                                                                                                                                                                                 |

**Ordering when loading:**  
Dashboard and public surfaces sort in application code via `categories/utils/sortServicesForDisplay.ts` (category sections by `sort_order`, then services within each bucket). `getServices` does not rely on a single global SQL `ORDER BY sort_order`.

### `service_price_options` (new)

This table stores multiple price choices for one service (for example: Sedan, SUV, Truck).

| Column             | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `id`               | UUID primary key                                                       |
| `service_id`       | FK to `business_services.id` (**ON DELETE CASCADE**)                   |
| `business_id`      | FK to `business_profiles.id` (used for ownership/RLS + fast filtering) |
| `label`            | Option name shown to customers (e.g. "Sedan")                          |
| `price_cents`      | Price in cents (>= 0)                                                  |
| `duration_minutes` | Duration in minutes (> 0)                                              |
| `sort_order`       | Display order within one service                                       |
| `is_active`        | Soft visibility toggle for booking                                     |
| `created_at`       | Set on insert                                                          |
| `updated_at`       | Updated by trigger                                                     |

**Notes**

- One service can have many options.
- Deleting a service deletes its options via cascade.
- `business_id` is auto-synced from parent `service_id` by trigger to prevent cross-business mismatches.
- Duplicate-label protection is currently not enforced (by product decision for now).

**Indexes**

- `(service_id, sort_order)` for ordered option loading per service.
- `(business_id)` for business-scoped reads.
- Partial index on `(service_id)` where `is_active = true` for booking reads.

**RLS ownership path**

- `auth.users.id` -> `profiles.user_id` -> `business_profiles.profile_id`
- Owner check used by policies:
  - `business_profiles.id = service_price_options.business_id`
  - `business_profiles.profile_id = auth.uid()`

**Policy summary**

- `authenticated` owners can select/insert/update/delete only their own option rows.
- Optional `anon` select policy can be enabled for public booking reads (`is_active = true` and parent service active).

---

## How Data Is Loaded

### Dashboard Services Page (`/dashboard/services`)

1. **Page (server):** `app/dashboard/services/page.tsx`
   - Ensures user is signed in and onboarding is completed (redirects otherwise).
   - Resolves business from `getOnboardingState(user.id)`.
   - Loads in parallel: `getServices(businessProfile.id)`, `getServiceCategories(businessProfile.id)`, add-ons.
   - Sorts services with `sortServicesForDisplay(services, categories)` before passing to the client.
2. **UI:** `ServicesWithAddOnsView` — tabs for **Services**, **Categories**, and **Add-ons**. Passes `initialServices`, `initialCategories`, and optional `fetchError` / `categoriesFetchError` into tab content components.

See **`categories/README.md`** for category CRUD, filter pills, bucket-scoped reorder, and error handling.

### Service Edit Page (`/dashboard/services/[serviceId]`)

1. **Page (server):** `app/dashboard/services/[serviceId]/page.tsx`
   - Ensures auth + completed onboarding.
   - Loads in parallel:
     - `getServices(businessProfile.id)` (base service row)
     - `getServiceCategories(businessProfile.id)` (category dropdown)
     - `getAddOns(businessProfile.id)` (add-on pool)
     - `getServiceAddOnIds(serviceId)` (selected add-ons)
     - `getServicePriceOptions(serviceId, businessProfile.id)` (price options)
2. **UI hydration:** `ServiceEditScreen` receives:
   - `service.price_options_enabled` (toggle initial state)
   - `initialPriceOptions` (`service_price_options` ordered by `sort_order`)
3. **Rendering rule:** if `price_options_enabled` is false, the pricing options section stays in the "off" state and base service price/duration remain the active values.

### Public Profile & Business Profile View

- **Public profile:** `app/[business-slug]/page.tsx` and `app/api/public/profile/[slug]/route.ts` query `business_services` with `is_active = true` and the same ordering (`sort_order` nulls last, then `created_at`). They do **not** use `getServices` from this feature; they use their own Supabase queries.
- **Business profile (view/edit):** `BusinessProfileApi.getCompleteBusinessProfile()` in the business-profile feature loads services with the same ordering and includes them in the full profile. Services are **not** edited there; they are only managed on the dashboard Services page.

---

## How Data Is Saved

All writes go through **Server Actions** in `actions/`. Each action:

1. Gets the current user via `supabase.auth.getUser()`.
2. Loads onboarding state with `getOnboardingState(user.id)` and checks `status === 'completed'` and `businessProfile.id`.
3. Calls the corresponding `api/` function with `businessProfile.id` (and any ids/payloads).

### Create service

- **Action:** `createServiceAction(payload: CreateServicePayload)`
- **API:** `createService(supabase, businessId, payload)`  
  Inserts one row: `name`, `description`, `price_cents`, `duration_minutes`, optional `category_id`, `is_active: true`. Does **not** set `sort_order` (stays null until user reorders).
- **Payload:** `name`, `description`, `price_cents`, `duration_minutes`, optional `category_id`.

### Update service

- **Action:** `updateServiceAction(serviceId, payload: UpdateServicePayload)`
- **API:** `updateService(supabase, serviceId, businessId, payload)`  
  Updates `name`, `description`, `price_cents`, `duration_minutes`, optional `category_id`, `updated_at`. Does not touch `is_active` or `sort_order`.
- **Payload:** Same shape as create plus `price_options_enabled` (optional).

### Delete service

- **Action:** `deleteServiceAction(serviceId)`
- **API:** `deleteService(supabase, serviceId, businessId)`  
  Deletes the row. No cascade needed for this table.

### Toggle visibility

- **Action:** `updateServiceIsActiveAction(serviceId, isActive: boolean)`
- **API:** `updateServiceIsActive(supabase, serviceId, businessId, isActive)`  
  Updates only `is_active` and `updated_at`.  
  **UI:** Optimistic update in `ServicesContent`: toggle state immediately, revert and show error if the action fails.

### Save sort order

- **Action:** `saveServicesOrderAction(orderedServiceIds: string[])`
- **API:** `updateServicesOrder(supabase, businessId, orderedIds)`  
  For each id in `orderedIds`, sets `sort_order` to **index × 10** and updates `updated_at`. Pass only ids from the **active category bucket** when category filters are in use.
  **When:** User clicks “Finish sorting” on the Services tab after reordering (drag or up/down).

### Save service price options

- **Action:** `saveServicePriceOptionsAction(serviceId, options)`
- **API:** `saveServicePriceOptions(supabase, serviceId, businessId, options)`
  - Replaces options atomically at the service scope by:
    1. deleting existing `service_price_options` for that `(service_id, business_id)`,
    2. inserting the new ordered list with `sort_order`.
- **Validation path (client):** `ServiceEditScreen` blocks save when:
  - toggle is ON and no options exist,
  - any option is missing name, price, or duration.
- **Toggle OFF behavior:** options remain stored in DB; they are ignored by UI/booking logic while disabled.

---

## Types (summary)

- **`ServiceRow`** — Full row from `business_services` (from DB types).
- **Payloads:** `CreateServicePayload`, `UpdateServicePayload` (name, description, price_cents, duration_minutes, optional `category_id`).
- **Results:** `GetServicesResult`, `CreateServiceResult`, `UpdateServiceResult`, `DeleteServiceResult`, `UpdateServiceIsActiveResult`, `UpdateServicesOrderResult` — all `{ success, data? | error? }` as appropriate.

All are defined in `types/services.ts` and re-exported from the feature `index.ts`.

---

## Error Handling

- **Load:** Page passes `fetchError` / `categoriesFetchError` into tab content; the UI shows an error state and does not render the list.
- **Mutations:** Each action returns `{ success, error? }` (and `data?` where relevant). Tab content and modals set local error state and optional rollback (e.g. toggle revert) when `success` is false. See **`categories/README.md`** for the full error-handling matrix.

---

## Testing

- **Duration utils:** `testing/serviceEditDuration.test.ts` validates parse/format/save-grid rules used by service + option durations.
- **Pricing options UI:** `testing/servicePriceOptionsSection.test.tsx` verifies pricing-options helper text behavior and toggle state UX.
- **Add-on duration utils:** `testing/addOnDurationForm.test.ts` covers add-on duration parsing and picker conversion.
- **Service categories:** `categories/testing/` — sort/filter utilities, reorder APIs, header UI. See **`categories/README.md#testing`**.

Recommended commands:

- `npx vitest run src/features/services/testing`
- `npx vitest run src/features/services/categories/testing`

---

## Booking (V2) and add-ons

- Public **`/[slug]/book`** loads **`duration_minutes`** (or legacy `hours_to_complete` × 60) for the selected service, then **`AvailabilityBookingPage`** adds **Σ add-on `duration_minutes`** for selected extras (see **`features/services/add-ons/README.md`** and **`features/availability/docs/FLOWS.md`**). Total minutes drive slots and the row inserted into **`bookings`**.

---

## Related Code (outside this feature)

- **Service categories:** `categories/README.md` and `docs/contracts/service-categories-data.md`
- **Onboarding:** New users add at least one service in **Onboarding V2 Step 2** (name, price, **duration**, description) via onboarding-specific APIs; duration uses the same **30-minute grid** as dashboard service edit. Order is not set until they use the dashboard Services page and reorder.
- **DB types:** `business_services` Row/Insert/Update are defined in `libs/supabase/client.ts` (Database type). This feature’s `ServiceRow` is the Row type for that table.
- **Public profile ordering:** Any place that displays services to the public should use the same ordering: `sort_order ASC NULLS LAST`, then `created_at ASC`, and filter by `is_active = true` for public views.
