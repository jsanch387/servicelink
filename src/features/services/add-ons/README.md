# Add-ons Feature

Add-ons are optional extras (e.g. wax, rush delivery) that customers can add when booking a service. They live in a **pool** per business and are **assigned to services** when editing each service.

---

## Data Model

### Two-table design

| Table                       | Purpose                                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `service_addons`            | **Pool** – add-on definitions (name, price, optional **duration**). One row per add-on, scoped by `business_id`. No service link here. |
| `service_addon_assignments` | **Junction** – which add-ons each service offers. Links `service_id` ↔ `addon_id`.                                                    |

### Why two tables?

One add-on (e.g. "Wax $10") can be offered by multiple services. One service can have multiple add-ons. That's a many-to-many relationship, so we need:

1. **Pool table** – single source of truth for each add-on (no duplicate name+price rows per service).
2. **Junction table** – which services offer which add-ons.

---

## Tables

### `service_addons` (pool)

| Column             | Type              | Purpose                                                                                                                                                                                                   |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | uuid              | Primary key                                                                                                                                                                                               |
| `business_id`      | uuid              | FK → business_profiles. Scopes add-ons to a business.                                                                                                                                                     |
| `name`             | text              | Add-on name (e.g. "Extra polish")                                                                                                                                                                         |
| `price_cents`      | integer           | Price in cents                                                                                                                                                                                            |
| `duration_minutes` | integer, nullable | **Optional** extra appointment time when this add-on is selected. Null/omit = price-only (no change to slot length). Same **30-minute grid** as services (see `addOnDurationForm.ts` + `timeOptions.ts`). |
| `created_at`       | timestamptz       | Set on insert                                                                                                                                                                                             |
| `updated_at`       | timestamptz       | Auto-updated via trigger                                                                                                                                                                                  |

**Index:** `idx_service_addons_business_id` for listing add-ons by business.

### `service_addon_assignments` (junction)

| Column       | Type                   | Purpose                      |
| ------------ | ---------------------- | ---------------------------- |
| `service_id` | uuid                   | FK → business_services       |
| `addon_id`   | uuid                   | FK → service_addons          |
| `created_at` | timestamptz            | When the assignment was made |
| _PK_         | (service_id, addon_id) | Composite primary key        |

**Indexes:** `idx_service_addon_assignments_service_id`, `idx_service_addon_assignments_addon_id`.

---

## User flow

1. **Add-ons tab** – User creates add-ons (name, price, **optional duration**). Each insert goes into `service_addons` only.
2. **Service edit** – When editing a service, user sees the full add-on pool and selects which to offer. On Save, service details and add-on assignments are persisted. Assignments are stored in `service_addon_assignments` (replace-all for that service).

---

## Code layout

```
add-ons/
├── README.md           # This file
├── api/
│   ├── createAddOn.ts  # Insert into service_addons (pool; optional duration_minutes)
│   ├── updateAddOn.ts  # Update name, price_cents, duration_minutes (updated_at via trigger)
│   ├── deleteAddOn.ts  # Delete from service_addons (CASCADE clears assignments)
│   └── getAddOns.ts    # Select from service_addons by business_id
├── actions/
│   ├── createAddOn.ts
│   ├── updateAddOn.ts
│   └── deleteAddOn.ts
└── (components live in components/add-ons/)
```

---

## RLS (summary)

- **service_addons:** Users can CRUD only rows where `business_id` matches their business.
- **service_addon_assignments:** Users can select/insert/delete only rows for services they own, and only for add-ons in their business pool.

---

## Related

- **Services README:** `../README.md` – main services feature docs.
- **V2 booking:** `getServiceWithAddOnsForBooking` / `getAddOnsByIdsForBooking` return `duration_minutes` for the public book flow; **`AvailabilityBookingPage`** sums base service + add-on minutes for slots and **`POST /api/public/bookings`**. See **`features/availability/docs/FLOWS.md`**.
- **getAddOnCounts:** `../api/getAddOnCounts.ts` – counts add-ons per service (from `service_addon_assignments`), used on the services list to show badges.
- **getServiceAddOnIds:** `../api/getServiceAddOnIds.ts` – returns addon_id[] for a service (for the edit screen).
- **saveServiceAddOnAssignments:** `../api/saveServiceAddOnAssignments.ts` – replaces assignments for a service with the given addon IDs (called on Save).
