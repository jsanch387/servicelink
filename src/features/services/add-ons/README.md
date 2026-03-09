# Add-ons Feature

Add-ons are optional extras (e.g. wax, rush delivery) that customers can add when booking a service. They live in a **pool** per business and are **assigned to services** when editing each service.

---

## Data Model

### Two-table design

| Table | Purpose |
|-------|---------|
| `service_addons` | **Pool** – add-on definitions (name, price). One row per add-on, scoped by `business_id`. No service link here. |
| `service_addon_assignments` | **Junction** – which add-ons each service offers. Links `service_id` ↔ `addon_id`. |

### Why two tables?

One add-on (e.g. "Wax $10") can be offered by multiple services. One service can have multiple add-ons. That's a many-to-many relationship, so we need:

1. **Pool table** – single source of truth for each add-on (no duplicate name+price rows per service).
2. **Junction table** – which services offer which add-ons.

---

## Tables

### `service_addons` (pool)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `business_id` | uuid | FK → business_profiles. Scopes add-ons to a business. |
| `name` | text | Add-on name (e.g. "Extra polish") |
| `price_cents` | integer | Price in cents |
| `created_at` | timestamptz | Set on insert |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Index:** `idx_service_addons_business_id` for listing add-ons by business.

### `service_addon_assignments` (junction)

| Column | Type | Purpose |
|--------|------|---------|
| `service_id` | uuid | FK → business_services |
| `addon_id` | uuid | FK → service_addons |
| `created_at` | timestamptz | When the assignment was made |
| *PK* | (service_id, addon_id) | Composite primary key |

**Indexes:** `idx_service_addon_assignments_service_id`, `idx_service_addon_assignments_addon_id`.

---

## User flow (current)

1. **Add-ons tab** – User creates add-ons (name + price). Each insert goes into `service_addons` only. No `service_addon_assignments` rows yet.
2. **Service edit** *(coming soon)* – When editing a service, user selects which add-ons to offer. That creates/deletes rows in `service_addon_assignments`.

---

## Code layout

```
add-ons/
├── README.md           # This file
├── api/
│   ├── createAddOn.ts  # Insert into service_addons (pool)
│   ├── updateAddOn.ts  # Update name, price_cents (updated_at via trigger)
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
- **getAddOnCounts:** `../api/getAddOnCounts.ts` – counts add-ons per service (from `service_addon_assignments`), used on the services list to show badges.
