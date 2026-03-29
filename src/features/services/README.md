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

| Column             | Purpose |
|--------------------|--------|
| `id`               | UUID, primary key |
| `business_id`       | FK to business (scope for all queries) |
| `name`              | Service name |
| `description`       | Optional text |
| `price_cents`       | Nullable (e.g. “Contact for quote”) |
| `duration_minutes`  | Nullable; **appointment length in minutes** for V2 booking (slot generation, `bookings.duration_minutes` when no add-on time). UI pickers use **30-minute steps** from 30m through 10h 30m (`TimeSelect` + `timeOptions.ts`). |
| `hours_to_complete` | Legacy; prefer `duration_minutes` (still read as fallback on public book page) |
| `is_active`         | If false, hidden on public profile |
| `sort_order`       | Integer; display order. Null until user uses “Sort order” on dashboard |
| `created_at`        | Set on insert |
| `updated_at`        | Set on update |

**Ordering when loading:**  
`ORDER BY sort_order ASC NULLS LAST, created_at ASC`  
So: explicit order first, then creation order for rows with no `sort_order`.

---

## How Data Is Loaded

### Dashboard Services Page (`/dashboard/services`)

1. **Page (server):** `app/dashboard/services/page.tsx`
   - Ensures user is signed in and onboarding is completed (redirects otherwise).
   - Resolves business from `getOnboardingState(user.id)`.
   - Calls `getServices(businessProfile.id)` from this feature.
2. **`getServices(businessId)`** (`api/getServices.ts`)
   - Uses server Supabase client.
   - Selects all rows for that `business_id`, ordered by `sort_order` then `created_at`.
   - Returns `{ success, data: ServiceRow[] | null, error }`.
3. **UI:** Passes `initialServices` and optional `fetchError` into `ServicesContent`, which keeps its own client state for list, add, edit, delete, reorder, and toggle.

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
  Inserts one row: `name`, `description`, `price_cents`, `duration_minutes`, `is_active: true`. Does **not** set `sort_order` (stays null until user reorders).
- **Payload:** `name`, `description`, `price_cents`, `duration_minutes`.

### Update service

- **Action:** `updateServiceAction(serviceId, payload: UpdateServicePayload)`
- **API:** `updateService(supabase, serviceId, businessId, payload)`  
  Updates `name`, `description`, `price_cents`, `duration_minutes`, `updated_at`. Does not touch `is_active` or `sort_order`.
- **Payload:** Same shape as create (name, description, price_cents, duration_minutes).

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
  For each id in `orderedIds`, sets `sort_order` to its index (0, 1, 2, …) and updates `updated_at`.  
  **When:** User clicks “Finish sorting” on the dashboard after reordering (drag or up/down). Order is the current list order; no order is persisted until the user explicitly finishes sorting.

---

## Types (summary)

- **`ServiceRow`** — Full row from `business_services` (from DB types).
- **Payloads:** `CreateServicePayload`, `UpdateServicePayload` (name, description, price_cents, duration_minutes).
- **Results:** `GetServicesResult`, `CreateServiceResult`, `UpdateServiceResult`, `DeleteServiceResult`, `UpdateServiceIsActiveResult`, `UpdateServicesOrderResult` — all `{ success, data? | error? }` as appropriate.

All are defined in `types/services.ts` and re-exported from the feature `index.ts`.

---

## Error Handling

- **Load:** Page passes `fetchError` into `ServicesContent`; the UI shows an error state and does not render the list.
- **Mutations:** Each action returns `{ success, error? }` (and `data?` where relevant). `ServicesContent` (and modals) set local error state and optional rollback (e.g. toggle revert) when `success` is false.

---

## Booking (V2) and add-ons

- Public **`/[slug]/book`** loads **`duration_minutes`** (or legacy `hours_to_complete` × 60) for the selected service, then **`AvailabilityBookingPage`** adds **Σ add-on `duration_minutes`** for selected extras (see **`features/services/add-ons/README.md`** and **`features/availability/docs/FLOWS.md`**). Total minutes drive slots and the row inserted into **`bookings`**.

---

## Related Code (outside this feature)

- **Onboarding:** New users add at least one service in **Onboarding V2 Step 2** (name, price, **duration**, description) via onboarding-specific APIs; duration uses the same **30-minute grid** as dashboard service edit. Order is not set until they use the dashboard Services page and “Sort order”.
- **DB types:** `business_services` Row/Insert/Update are defined in `libs/supabase/client.ts` (Database type). This feature’s `ServiceRow` is the Row type for that table.
- **Public profile ordering:** Any place that displays services to the public should use the same ordering: `sort_order ASC NULLS LAST`, then `created_at ASC`, and filter by `is_active = true` for public views.
