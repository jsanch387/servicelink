# Service Categories

Service categories group related services on the owner dashboard (e.g. Cars, Boats, RVs). Each service belongs to **at most one** category via `business_services.category_id`. Categories and add-ons are independent.

**Dashboard entry:** `/dashboard/services` — **Categories** tab, **Services** tab (filter pills + bucket reorder), and category picker on create/edit service.

**Full DB contract (web + mobile):** [`docs/contracts/service-categories-data.md`](../../../../docs/contracts/service-categories-data.md)

---

## Mental model

```
business_profiles (1)
    │
    ├── service_categories (*)     sort_order → category section / filter tab order
    │         ▲
    │         │ category_id (nullable, ON DELETE SET NULL)
    │         │
    └── business_services (*)      sort_order → order WITHIN each category bucket
```

- **Category order** — `service_categories.sort_order` (0, 10, 20, … after reorder save).
- **Service order** — `business_services.sort_order` is **scoped per category bucket** (including uncategorized). Reordering on the Services tab only updates services in the **active filter bucket**, not the whole business list.
- **Uncategorized** — `category_id IS NULL`. Shown as a **No category** filter pill when at least one uncategorized service exists.

---

## Tables

### `service_categories`

| Column        | Type        | Purpose                                                 |
| ------------- | ----------- | ------------------------------------------------------- |
| `id`          | uuid        | Primary key                                             |
| `business_id` | uuid        | FK → `business_profiles.id`                             |
| `name`        | text        | Display name; unique per business (`lower(trim(name))`) |
| `sort_order`  | int ≥ 0     | Category section order on dashboard / public (future)   |
| `created_at`  | timestamptz | Set on insert                                           |
| `updated_at`  | timestamptz | Set on update                                           |

### `business_services.category_id` (column on existing table)

| Column        | Type          | Purpose                                            |
| ------------- | ------------- | -------------------------------------------------- |
| `category_id` | uuid nullable | FK → `service_categories.id`, `ON DELETE SET NULL` |

Deleting a category **does not** delete services; their `category_id` becomes `null`.

A DB trigger rejects assigning a category from a different business.

---

## Fetch (read paths)

| Where                             | Function                                 | Table(s)             | Notes                                                              |
| --------------------------------- | ---------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `/dashboard/services` page        | `getServiceCategories(businessId)`       | `service_categories` | `SELECT *` where `business_id`, order `sort_order`, `created_at`   |
| Same page                         | `getServices(businessId)`                | `business_services`  | Includes `category_id`; sorted in app via `sortServicesForDisplay` |
| `/dashboard/services/[serviceId]` | `getServiceCategories` + `getServices`   | both                 | Category dropdown on edit screen                                   |
| Public profile / booking          | `getServices` + categories (where wired) | both                 | Same bucket sort helpers                                           |

**Page wiring:** `src/app/dashboard/services/page.tsx` loads services + categories in parallel, passes `initialCategories` and optional `categoriesFetchError` into `ServicesWithAddOnsView`.

**Client display sort:** `categories/utils/sortServicesForDisplay.ts` — category sections in `sort_order` order, then within-bucket service sort (`sort_order` → `created_at` → `name`). Used on dashboard load, after reorder, and on public surfaces that import it.

**Filter pills:** Built by `buildServiceCategoryFilterOptions`; visibility gated by `shouldShowServiceCategoryFilters` (shown when 2+ categories exist **or** any service is uncategorized).

---

## Mutations (write paths)

### Category CRUD

| User action        | Server action                      | API                            | Table                | What changes                                   |
| ------------------ | ---------------------------------- | ------------------------------ | -------------------- | ---------------------------------------------- |
| Add category       | `createServiceCategoryAction`      | `createServiceCategory`        | `service_categories` | `INSERT` name, `sort_order` = max+10           |
| Edit category name | `updateServiceCategoryAction`      | `updateServiceCategory`        | `service_categories` | `UPDATE` name, `updated_at`                    |
| Delete category    | `deleteServiceCategoryAction`      | `deleteServiceCategory`        | `service_categories` | `DELETE`; services → `category_id` NULL via FK |
| Reorder categories | `saveServiceCategoriesOrderAction` | `updateServiceCategoriesOrder` | `service_categories` | `UPDATE sort_order` per id: index × 10         |

### Service ↔ category assignment

| User action                     | Server action             | API                   | Table               | What changes                                             |
| ------------------------------- | ------------------------- | --------------------- | ------------------- | -------------------------------------------------------- |
| Create service with category    | `createServiceAction`     | `createService`       | `business_services` | `INSERT` including `category_id`                         |
| Edit service category           | `updateServiceAction`     | `updateService`       | `business_services` | `UPDATE category_id`                                     |
| Reorder services (Services tab) | `saveServicesOrderAction` | `updateServicesOrder` | `business_services` | `UPDATE sort_order` for **bucket ids only** (index × 10) |

All server actions resolve auth + `business_id` via `getOnboardingState` before calling the API layer.

---

## Code layout

```
categories/
├── README.md                          # This file
├── index.ts                           # Public exports (actions + types)
├── types/
│   └── serviceCategories.ts           # ServiceCategoryRow, result types, __uncategorized__ id
├── api/                               # Server-only DB layer (no auth)
│   ├── getServiceCategories.ts
│   ├── createServiceCategory.ts
│   ├── updateServiceCategory.ts
│   ├── deleteServiceCategory.ts
│   └── updateServiceCategoriesOrder.ts
├── actions/                           # Next.js Server Actions
│   ├── createServiceCategory.ts
│   ├── updateServiceCategory.ts
│   ├── deleteServiceCategory.ts
│   └── saveServiceCategoriesOrder.ts
├── utils/
│   ├── sortServicesForDisplay.ts      # Bucket sort + applyBucketSortOrder
│   ├── buildServiceCategoryFilterOptions.ts
│   ├── filterServicesByCategoryFilter.ts
│   └── shouldShowServiceCategoryFilters.ts
└── testing/                           # Unit tests (see Testing below)

components/categories/                 # UI (Categories tab + pickers)
├── CategoriesContent.tsx              # List, CRUD, reorder
├── CategoryManagementCard.tsx
├── EditCategoryModal.tsx
├── ServiceCategoryDropdown.tsx        # Service edit page
├── ServiceCategoryPickerSection.tsx
├── ServicesCategoryFilterPills.tsx    # (re-exported from components/)
└── getCategoryNameById.ts

components/
├── ServicesWithAddOnsView.tsx         # Services / Categories / Add-ons tabs
├── ServicesContent.tsx                # Filter pills, bucket-scoped reorder
└── ServicesTabListHeader.tsx          # Shared count + Reorder row
```

Service reorder API lives in `../api/updateServicesOrder.ts` (shared with the main services feature).

---

## UI behavior (summary)

| Surface               | Behavior                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Categories tab**    | CRUD, drag/arrow reorder, sticky Add category                                                                |
| **Services tab**      | Category filter pills when rules met; reorder only active bucket; Reorder hidden when &lt; 2 items in bucket |
| **Add service modal** | Category dropdown; pre-selects active filter when adding from a category                                     |
| **Service edit page** | `ServiceCategoryDropdown` persists `category_id` on Save                                                     |

---

## Error handling

All API and action functions return `{ success, error?, data? }`. User-facing messages use `sanitizeDbError` where appropriate. Duplicate category names map to a clear message (`23505`).

| Failure                          | Where user sees it                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| Categories failed to load (page) | Red card in **Categories** tab: “Could not load categories” + message (`categoriesFetchError`) |
| Services failed to load (page)   | Same pattern on **Services** tab (`fetchError`)                                                |
| Create / update category         | Inline error in `EditCategoryModal` (`saveError`)                                              |
| Delete category                  | Inline error in delete confirmation modal (`deleteError`)                                      |
| Category reorder save            | Red banner below count row in Categories tab (`orderError`)                                    |
| Create service (with category)   | Inline error in `EditServiceModal` (`saveError`)                                               |
| Service reorder save             | Red banner below count row on Services tab (`orderError`)                                      |
| Toggle service active            | Red banner on Services tab (`toggleError`); optimistic UI rolls back                           |
| Delete service                   | Inline error in delete modal (`deleteError`)                                                   |
| Service edit (incl. category)    | Banner on edit screen via `priceOptionsSubmitError` when `updateServiceAction` fails           |

Auth / onboarding failures in actions return short messages (e.g. “You must be signed in…”) surfaced through the same UI state.

**Note:** If categories fail to load on the service edit page, the picker receives an empty list (degraded UX, not a hard error screen).

---

## Testing

Unit tests live under `categories/testing/` and related paths:

| File                                                           | Covers                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| `sortServicesForDisplay.test.ts`                               | Bucket sort, category sections, `applyBucketSortOrder` |
| `buildServiceCategoryFilterOptions.test.ts`                    | Pill labels, counts, No category pill                  |
| `shouldShowServiceCategoryFilters.test.ts`                     | When filters show                                      |
| `filterServicesByCategoryFilter.test.ts`                       | Active bucket filtering                                |
| `updateServiceCategoriesOrder.test.ts`                         | Category reorder persistence                           |
| `../testing/updateServicesOrder.test.ts`                       | Service bucket reorder persistence                     |
| `../components/testing/ServicesTabListHeader.test.tsx`         | Count row, Reorder visibility                          |
| `../components/categories/testing/getCategoryNameById.test.ts` | Name lookup                                            |

Run: `npm test -- src/features/services/categories/testing`

---

## Related

- **Services README:** `../README.md` — main services feature, `business_services`, service reorder
- **Add-ons README:** `../add-ons/README.md` — independent M:N add-on pool
- **Contract:** `docs/contracts/service-categories-data.md` — shared web/mobile data contract
