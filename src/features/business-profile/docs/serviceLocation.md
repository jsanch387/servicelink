# Service location (mobile / shop / both)

How a business defines **where** service happens: mobile (you go to the customer), shop (they come to you), or both. Used in dashboard profile **edit → Booking** tab, stored on `business_profiles`, and drives the public booking link customer flow.

A detailer can serve Austin for mobile jobs and have a shop in Pflugerville. Those are two places.

---

## Source of truth (database)

Shop city/state/ZIP columns already exist on `business_profiles` (added from mobile). Do not add another migration.

| Column                  | Type   | Purpose                                                                  |
| ----------------------- | ------ | ------------------------------------------------------------------------ |
| `service_area`          | `text` | **Mobile serving city + state** as `"City, ST"`                          |
| `business_zip`          | `text` | **Mobile serving ZIP** (optional). Never written from the shop ZIP field |
| `service_location_mode` | `text` | `mobile_only` \| `shop_only` \| `both`. Default `mobile_only`            |
| `shop_street_address`   | `text` | Physical shop street                                                     |
| `shop_unit`             | `text` | Optional suite or unit                                                   |
| `shop_city`             | `text` | Physical shop city                                                       |
| `shop_state`            | `text` | Physical shop state                                                      |
| `shop_zip`              | `text` | Physical shop ZIP (optional; 5 digits when present)                      |

**Details → Location** is mobile serving area only (`service_area`, `business_zip`, primary `business_service_areas` row + radius). Example: `Austin, TX · 25 mi`.

**Booking → Shop address** is the physical shop only (`shop_street_address`, `shop_unit`, `shop_city`, `shop_state`, `shop_zip`). Example: `410 E Pecan St, Pflugerville, TX 78660`.

Never stitch shop street onto the serving city. Never copy a shop pick into Details. Never edit `business_zip` from the shop ZIP field.

When mode is `mobile_only`, persist **all** shop columns as `null`.

---

## Mental model

```
Coverage (Details → Location, MapTiler)
  business_service_areas (primary) → city, state, lat/lng, radius
  business_profiles.service_area   → "Austin, TX"
  business_profiles.business_zip   → "78701"

Shop (Booking tab, MapTiler street pick)
  shop_street_address  →  "410 E Pecan St"
  shop_unit            →  typed separately (optional)
  shop_city            →  "Pflugerville"
  shop_state           →  "TX"
  shop_zip             →  "78660"

Shop display  →  formatFullShopAddress({ street, unit, shopCity, shopState, shopZip })
Mobile / booking link → formatServiceCoverageLabel(city, state, radius)  e.g. "Austin, TX · 25 mi"
```

Public pages never receive lat/lng.

**Legacy display only:** if `shop_city` is empty, public labels may fall back to the serving city so old street-only rows do not go blank. Do not write that fallback into the database. New saves must write `shop_*`.

---

## Dashboard edit UI

**Route:** `/dashboard/business-profile?mode=edit`

### Legacy shop address prompt

Shop or Both profiles that still have the old street-only shop row (`shop_city` / `shop_state` missing) see a dashboard modal: **Update your shop address**. The CTA opens:

`/dashboard/business-profile?mode=edit&tab=booking&focus=shop-address`

That lands on the Booking tab and focuses `#profile-shop-address`. Mobile-only profiles do not see this modal — they already get the service-area prompt. The two modals never stack: the shop prompt waits until the service-area prompt is closed or skipped.

| Control                                                 | Maps to                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Details → Location** city/state autocomplete + radius | primary `business_service_areas` row + `service_area` / `business_zip`    |
| Service type: Mobile / Shop / Both                      | `service_location_mode`                                                   |
| Shop → MapTiler street pick + optional Unit             | `shop_street_address`, `shop_unit`, `shop_city`, `shop_state`, `shop_zip` |

**Details → Location** and **Booking → Mobile** share the same coverage editor (MapTiler city/ZIP + travel distance). Both still shows a **Mobile area** summary with Edit → Details. Shop uses a MapTiler **street-address** search. City/state/ZIP come from the selected address. Unit is typed separately and never sent to MapTiler.

### Validation on save

| Rule                                          | Error (examples)                            |
| --------------------------------------------- | ------------------------------------------- |
| Confirmed MapTiler city/state + radius        | `Choose a suggested location to confirm it` |
| Shop or Both → confirm a MapTiler street pick | `Choose a suggested shop address`           |
| Shop ZIP optional; if present, 5 digits       | `Shop ZIP must be 5 digits`                 |

Details city/state/ZIP are **not** required to complete a shop address.

Save errors route to tabs via `tabForSaveErrors()` in `utils/editProfileTab.ts` (shop → **Booking**, generic location → **Details**).

### Persist path

1. `EditBusinessProfile` validates coverage, then `savePrimaryServiceArea()` → `POST /api/business-profile/service-area` (upserts `business_service_areas`, syncs `service_area` / ZIP)
2. `saveBusinessProfile()` in `utils/editing/editingHelpers.ts`
3. `validateEditingForm()` in `utils/editing/editingValidation.ts`
4. `transformFormDataForAPI()` merges `serviceLocationPersistFromUi()`
5. `BusinessProfileApi.updateBusinessProfile()`

`serviceLocationPersistFromUi()` writes `shop_*` only. Details / service-area save is unchanged.

---

## Code map

| Area                                      | Path                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| Location + mode helpers (import barrel)   | `utils/location/index.ts`                            |
| City/state/ZIP parse, format, validate    | `utils/businessLocation.ts`                          |
| Mode UI state, hydrate, persist, validate | `utils/serviceLocationMode.ts`                       |
| Booking tab card                          | `components/DashboardProfileServiceLocationCard.tsx` |
| Details tab location                      | `components/edit/sections/BusinessInfoSection.tsx`   |
| Coverage editor (MapTiler + radius)       | `components/DashboardProfileCoverageCard.tsx`        |
| Primary service area loader               | `server/loadPrimaryServiceArea.ts`                   |
| Form types                                | `utils/editing/editingTypes.ts`                      |
| Form validation (no API deps)             | `utils/editing/editingValidation.ts`                 |
| Save + transform                          | `utils/editing/editingHelpers.ts`                    |
| Public booking location builder           | `utils/publicServiceLocation.ts`                     |
| Supabase types                            | `src/libs/supabase/client.ts` → `business_profiles`  |

### Key helpers (for public booking)

```ts
import {
  formatFullShopAddress,
  formatProfileLocationLabel,
  shopAddressIsOffered,
  mobileServiceIsOffered,
  serviceLocationUiFromProfile,
} from '@/features/business-profile/utils/location';
```

- **`formatProfileLocationLabel(city, state, zip)`** — mobile serving label, e.g. `"Austin, TX 78701"`
- **`formatFullShopAddress({ street, unit, city, state, zip })`** — shop mailing line from **shop** fields
- **`shopAddressIsOffered(mode)`** — true for `shop_only` and `both`
- **`mobileServiceIsOffered(mode)`** — true for `mobile_only` and `both`

Load: serving city from `service_area` / coverage. Shop city from `shop_*` only.

---

## Public booking link

**Status:** Implemented on `/:slug/book`. The flow reads `service_location_mode` and shop fields from `business_profiles` and branches accordingly.

| `service_location_mode` | Customer experience                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `mobile_only`           | Service details → visit calendar → **contact + address** (one screen) → vehicle/notes → review                          |
| `shop_only`             | Service details → visit calendar → contact → vehicle/notes → review (shop address prefilled on submit)                  |
| `both`                  | Price / add-ons (combined) → **mobile vs shop** on `/book/details` → visit calendar → contact (+ address if mobile) → … |

Location choice is collected **before date/time** on `/book/details` when mode is `both` (and as a pre-schedule step on `/book` for custom owner jobs that skip details). Query param: `serviceLocationType=mobile|shop`.

`buildPublicBookingServiceLocation` keeps `city` / `state` / `zip` / `coverageLabel` as the **mobile serving area**. `shopCity` / `shopState` / `shopZip` and `shopAddressLabel` come from shop fields. `hasCompleteShopAddress` is street + shop city + shop state (ZIP optional). `prefillCustomerWithShopAddress` uses shop city/state/zip.

Public multi-job visit cart + step order: **[public-multi-job-booking.md](../../../../docs/contracts/public-multi-job-booking.md)**.

**Touch points:**

- `src/app/[business-slug]/book/page.tsx` — SSR loads location columns; visit cart / picker
- `src/app/[business-slug]/book/details/page.tsx` — service setup + location choice when `both`
- `src/features/services/booking-flow/ServiceDetailsScreen.tsx` — combined price + add-ons → location phases
- `src/features/business-profile/utils/publicServiceLocation.ts` — `buildPublicBookingServiceLocation`
- `src/features/availability/booking/utils/bookingServiceLocationFlow.ts` — contact/address merge + validation
- `src/features/availability/booking/components/BookingServiceLocationSteps.tsx` — choice UI
- `src/features/availability/booking/components/AvailabilityBookingPage.tsx` — schedule + details + review
- `POST /api/public/bookings` and `POST /api/public/booking-checkout` — server-side address rules + shop prefill

See also: `src/features/availability/docs/FLOWS.md` §2 (public V2 booking).

---

## Tests

| File                                    | Covers                                                |
| --------------------------------------- | ----------------------------------------------------- |
| `testing/businessLocation.test.ts`      | ZIP/city validation, `formatFullShopAddress`          |
| `testing/serviceLocationMode.test.ts`   | Hydrate, persist, shop validation, legacy shop prompt |
| `testing/validateEditingForm.test.ts`   | Full form + shop rules                                |
| `testing/publicServiceLocation.test.ts` | Public booking location builder + mode resolution     |

Run: `npm test -- src/features/business-profile/testing/`

---

## Quick QA checklist (dashboard)

- **Details** = Austin + radius. **Booking** = Both. Shop = MapTiler pick in Pflugerville + optional unit. Save.
- Serving area still Austin. Shop fields still Pflugerville.
- Public book as shop → Pflugerville. Public book as mobile → customer address, coverage Austin.
- Switch to Mobile only → save → all `shop_*` null.
- **Mobile only:** save without shop street; MapTiler city/state + radius required.
- Profile completion checklist includes **Service area**.
- Public booking link header shows `City, ST · 25 mi` (no coordinates).

---

## Profile completion tracker

`ProfileCompletionTracker` checks city/state from the primary service area (or legacy `service_area`). ZIP is optional for mobile. Shop street is not a separate checklist item today.
