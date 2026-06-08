# Contract: Service categories — data layer (web)

**DATA ONLY.** This document describes Supabase tables, reads, writes, and derived shapes for service categories on web. It does **not** specify UI (tabs, modals, dropdowns, layout). Web and mobile share the **same database contract**.

**Scope (web v1):** Owner dashboard **Services** screen (`/dashboard/services`) and **Service edit** page (`/dashboard/services/[serviceId]`). Public profile / booking-link category filtering is documented for completeness but is **out of scope** for the first web pass unless noted.

---

## Mental model

- A **category** is an optional browsing group (e.g. Cars, RVs, Boats) — **not** a reusable service type.
- Each **service** (`business_services`) remains its own bookable offering (name, price, duration, etc.).
- A service has **0 or 1** category via `business_services.category_id`.
- Categories and add-ons are **independent**:
  - Categories → `business_services.category_id` (0..1)
  - Add-ons → `service_addon_assignments` (M:N)

---

## Relationship diagram

```
business_profiles (1)
    │
    ├── service_categories (*)           sort_order → category section order
    │         ▲
    │         │ category_id (nullable, ON DELETE SET NULL)
    │         │
    ├── business_services (*)            sort_order → order WITHIN category bucket
    │
    ├── service_addons (*)
    │         ▲
    │         │ service_addon_assignments (M:N)
    └── business_services
```

---

## Tables

### `service_categories`

| Column        | Type                             | Notes                                                           |
| ------------- | -------------------------------- | --------------------------------------------------------------- |
| `id`          | uuid PK                          |                                                                 |
| `business_id` | uuid FK → `business_profiles.id` | CASCADE on business delete                                      |
| `name`        | text                             | Trimmed, 1–80 chars; unique per business on `lower(trim(name))` |
| `sort_order`  | int ≥ 0                          | Order of category sections / filter tabs                        |
| `created_at`  | timestamptz                      |                                                                 |
| `updated_at`  | timestamptz                      |                                                                 |

### `business_services.category_id` (column on existing table)

| Column        | Type                                       | Notes                                                                   |
| ------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `category_id` | uuid nullable FK → `service_categories.id` | `ON DELETE SET NULL` — deleting a category does **not** delete services |

**DB trigger:** `trg_business_services_category_business` rejects assigning a category that belongs to a different business.

---

## Categories vs add-ons

|                       | Categories                             | Add-ons                           |
| --------------------- | -------------------------------------- | --------------------------------- |
| Catalog table         | `service_categories`                   | `service_addons`                  |
| Link to service       | `business_services.category_id` (0..1) | `service_addon_assignments` (M:N) |
| Delete category/addon | Services survive; `category_id` → NULL | Assignment rows cascade           |

---

## Normalized shapes (web should build from DB rows)

### Category row (`service_categories`)

Map DB snake_case to app types as needed:

```ts
{
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

UI-friendly alias (optional):

```ts
{
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string | null;
}
```

### Service row (`business_services`)

Existing `ServiceRow` plus:

```ts
category_id: string | null; // FK on the row — source of truth
```

Optional derived field when mapping for components:

```ts
categoryId: string | null; // same as category_id
```

### Assignment map (derived — **not** a table)

Built from service rows; do **not** persist separately:

```ts
serviceCategoryById: Record<string, string | null>;
// serviceCategoryById[serviceId] = row.category_id ?? null
```

---

## Read: owner catalog (`/dashboard/services`)

**Entry point:** `src/app/dashboard/services/page.tsx`  
**Today:** calls `getServices(businessId)` only.  
**Target:** parallel fetch (same pattern as add-ons on that page).

### Parallel queries

Run together for `businessProfile.id`:

1. **Categories**

   ```sql
   SELECT * FROM service_categories
   WHERE business_id = $1
   ORDER BY sort_order ASC, created_at ASC;
   ```

2. **Services** (existing — ensure `select('*')` includes `category_id`)

   ```sql
   SELECT * FROM business_services
   WHERE business_id = $1
   ORDER BY sort_order ASC NULLS LAST, created_at ASC;
   ```

   Implemented today in `src/features/services/api/getServices.ts`.

3. **Build assignment map** client-side or server-side:
   ```ts
   const serviceCategoryById: Record<string, string | null> = {};
   for (const s of services) {
     serviceCategoryById[s.id] = s.category_id ?? null;
   }
   ```

### Failure behavior

| Fetch      | On failure                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Categories | Return `[]`, set `categoriesFetchError`; **do not** block services list |
| Services   | Existing behavior — show error state                                    |

### Suggested API module (mirror add-ons)

```
src/features/services/categories/
├── api/
│   ├── getServiceCategories.ts
│   ├── createServiceCategory.ts
│   ├── updateServiceCategory.ts
│   ├── deleteServiceCategory.ts
│   └── updateServiceCategoriesOrder.ts
├── actions/
│   └── (server actions — auth via getOnboardingState, same as createServiceAction)
└── types/
    └── serviceCategories.ts
```

---

## Read: service edit page (`/dashboard/services/[serviceId]`)

**Entry point:** `src/app/dashboard/services/[serviceId]/page.tsx`  
**Today:** parallel fetch for services, add-ons, assignments, price options.

**Add:** `getServiceCategories(businessProfile.id)` in the same `Promise.all`.

**Current category for the service:** read from the service row:

```ts
const currentCategoryId = service.category_id ?? null;
```

Do **not** use localStorage or a separate assignment map on this page once wired to DB.

---

## Read: public profile / booking link (future web)

Not required for dashboard v1. Documented for parity with mobile.

Parallel fetch:

1. `business_services` WHERE `business_id = $1` AND `is_active = true` ORDER BY `sort_order`, `created_at`
2. `service_categories` WHERE `business_id = $1` ORDER BY `sort_order`, `created_at`

**Today:** `src/app/api/public/profile/[slug]/route.ts` and `BusinessProfileApi.getCompleteBusinessProfile` return services only — add `serviceCategories` to payload when public filtering is implemented.

Each service in the response should expose `category_id` (or mapped `categoryId`).

---

## Write: category CRUD

All writes scoped by `business_id` from `getOnboardingState(user.id)` → `businessProfile.id`.  
Pattern: **server action** → **api/** function with authenticated Supabase client (same as `src/features/services/add-ons/`).

### Create

```ts
INSERT INTO service_categories (business_id, name, sort_order)
VALUES ($businessId, trim($name), $sortOrder?);
```

- `sort_order` optional; default to `(max existing sort_order + 1)` or `count * 10`
- Duplicate name → Postgres **`23505`** → user message: _"A category with this name already exists."_

### Update (rename)

```ts
UPDATE service_categories
SET name = trim($name), updated_at = now()
WHERE id = $id AND business_id = $businessId;
```

Same duplicate-name handling on `23505`.

### Delete

```ts
DELETE FROM service_categories
WHERE id = $id AND business_id = $businessId;
```

- Services are **not** deleted
- DB FK sets `business_services.category_id = NULL` automatically
- **Do not** block delete when services are assigned (mobile allows delete; services become uncategorized)

> **Note:** Current web UI prototype blocks delete when services are assigned — remove that guard when wiring to DB.

### Reorder categories

For each id in the ordered array:

```ts
UPDATE service_categories
SET sort_order = index * 10, updated_at = now()
WHERE id = $id AND business_id = $businessId;
```

---

## Write: assign category to a service

**No join table.** Set `category_id` on `business_services`.

### Create service

Extend `CreateServicePayload` / `createService` insert:

```ts
category_id: payload.category_id ?? null; // omit or null = uncategorized
```

**Action:** `src/features/services/actions/createService.ts`  
**API:** `src/features/services/api/createService.ts`

### Edit service

Extend `UpdateServicePayload` / `updateService` update:

```ts
category_id: payload.category_id ?? null; // explicit null clears assignment
```

Persist on the **service edit save** alongside name, description, price, duration, add-ons, price options.

**Action:** `src/features/services/actions/updateService.ts`  
**API:** `src/features/services/api/updateService.ts`  
**Screen:** `src/features/services/components/ServiceEditScreen.tsx` — include `category_id` in the `updateServiceAction` call.

**Picker “None”:** send `null` (or omit → treat as null). Never persist sentinel strings.

---

## Write: service sort order

`business_services.sort_order` is scoped **within** the active category bucket when categories exist.

| Scenario      | Reorder scope                                       |
| ------------- | --------------------------------------------------- |
| 0 categories  | Flat list — update all ordered ids                  |
| 1+ categories | Update only services in the **active filter/group** |

Save pattern (align with mobile):

```ts
sort_order = index * 10; // per service id in the ordered array for that bucket
```

**Today:** `src/features/services/api/updateServicesOrder.ts` sets `sort_order = index` (0, 1, 2…) for the full flat list. When categories ship, pass **bucket-scoped** ordered ids from the active category filter.

---

## Filter visibility (logic only)

Shared rules for when the owner Services screen should expose category filters. Implement as a pure function (e.g. `shouldShowServiceCategoryFilters`).

```ts
function shouldShowServiceCategoryFilters(
  categories: { id: string }[],
  services: { category_id: string | null }[]
): boolean {
  if (categories.length === 0) return false;
  if (categories.length >= 2) return true;
  // exactly 1 category
  return services.some(s => s.category_id == null);
}
```

| Condition                               | Show filters?  |
| --------------------------------------- | -------------- |
| 0 categories                            | No             |
| 1 category, all services assigned to it | No (redundant) |
| 1 category, some unassigned             | Yes            |
| 2+ categories                           | Yes            |

**Uncategorized services:** `category_id IS NULL`.

### Virtual sentinel IDs (client only — never persist)

| ID                  | Meaning                   | Used on                                        |
| ------------------- | ------------------------- | ---------------------------------------------- |
| `__uncategorized__` | Services with no category | Owner list filter / grouping                   |
| `__all__`           | Show every service        | Public booking link only (not owner dashboard) |

---

## Grouping services for display (derived data)

Given `categories[]`, `services[]`, and optional active filter id:

1. Sort categories by `sort_order`, then `created_at`
2. Bucket services by `category_id` (unknown ids → uncategorized bucket)
3. Within each bucket, sort by `sort_order`, then `created_at`
4. Omit empty category buckets unless that category is the active filter

Existing helper (update to read `service.category_id` instead of a side map):  
`src/features/services/components/categories/groupServicesByCategory.ts`

---

## RLS (Supabase)

| Role   | `service_categories`                                        |
| ------ | ----------------------------------------------------------- |
| Owner  | Full CRUD where `business_profiles.profile_id = auth.uid()` |
| Public | SELECT when business has ≥1 active service                  |

Web uses **server Supabase client** with owner session for dashboard writes (`createSupabaseServerClient` in actions).

---

## Do NOT

- Do **not** create a service↔category join table
- Do **not** treat categories like add-ons (no M:N assignment table)
- Do **not** delete services when deleting a category
- Do **not** persist `__uncategorized__`, `__all__`, or `__none__` to the database
- Do **not** use localStorage for category state in production (remove `serviceCategoriesUiStorage.ts` when wired)

---

## Web implementation checklist

| Task                               | File(s)                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Regenerate / extend Supabase types | `src/libs/supabase/client.ts` — add `service_categories`, `business_services.category_id` |
| Fetch categories                   | New `getServiceCategories.ts`; call from `app/dashboard/services/page.tsx`                |
| Category CRUD actions              | `src/features/services/categories/actions/*`                                              |
| Pass categories to dashboard       | `ServicesWithAddOnsView` props — replace `useServiceCategoriesUiState`                    |
| Create service + category          | `createService.ts` payload + insert                                                       |
| Edit service + category            | `updateService.ts` payload + `ServiceEditScreen` save                                     |
| Bucket-scoped reorder              | `updateServicesOrder.ts` + `ServicesContent` sort handler                                 |
| Filter visibility helper           | New util consumed by Services list                                                        |
| Public profile (later)             | `app/api/public/profile/[slug]/route.ts`, `businessProfileApi.ts`                         |

---

## Current web state (prototype — replace)

The branch may contain **UI-only** category management:

- Local state + `localStorage` via `useServiceCategoriesUiState` / `serviceCategoriesUiStorage.ts`
- Assignment map separate from `business_services.category_id`

**Replace entirely** with Supabase reads/writes described above. The database is already live for mobile.
