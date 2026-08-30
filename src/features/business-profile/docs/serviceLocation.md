# Service location (mobile / shop / both)

How a business defines **where** service happens: mobile (you go to the customer), shop (they come to you), or both. Used in dashboard profile **edit → Booking** tab, stored on `business_profiles`, and drives the public booking link customer flow.

---

## Source of truth (database)

Migrations:

- `supabase/migrations/20250630120000_add_business_zip.sql`
- `supabase/migrations/20250630130000_add_service_location_and_shop_address.sql`

| Column                  | Type   | Purpose                                                       |
| ----------------------- | ------ | ------------------------------------------------------------- |
| `service_area`          | `text` | **City + state** as `"City, ST"` (synced from service area)   |
| `business_zip`          | `text` | **US ZIP** (5 digits). Optional for mobile; required for shop |
| `service_location_mode` | `text` | `mobile_only` \| `shop_only` \| `both`. Default `mobile_only` |
| `shop_street_address`   | `text` | Street where customers visit (shop / both)                    |
| `shop_unit`             | `text` | Optional suite or unit                                        |

**Not duplicated:** city, state, and ZIP are **not** stored again on shop fields. Shop address = `shop_street_address` + optional `shop_unit` + profile `service_area` + `business_zip`.

---

## Mental model

```
Coverage (Details → Location, MapTiler)
  business_service_areas (primary) → city, state, lat/lng, radius
  business_profiles.service_area   → "Austin, TX" (legacy sync)
  business_profiles.business_zip   → ZIP when the pick includes one

When mode is shop_only or both
  shop_street_address  →  "123 Main St"
  shop_unit            →  "Suite 4" (optional)

Full shop display  →  formatFullShopAddress({ street, unit, city, state, zip })
Mobile / booking link → formatServiceCoverageLabel(city, state, radius)  e.g. "Austin, TX · 25 mi"
```

One base location per business. Mobile jobs and shop visits share city/state; only street/unit are shop-specific. Public pages never receive lat/lng.

---

## Dashboard edit UI

**Route:** `/dashboard/business-profile?mode=edit`

| Control                                                 | Maps to                                            |
| ------------------------------------------------------- | -------------------------------------------------- |
| **Details → Location** city/state autocomplete + radius | primary `business_service_areas` row               |
| Service type: Mobile / Shop / Both                      | `service_location_mode`                            |
| Shop → Street, Unit, ZIP                                | `shop_street_address`, `shop_unit`, `business_zip` |

City, state, and radius are edited only under **Details → Location** (same MapTiler picker as the dashboard “Where do you serve?” modal). Booking tab shows a read-only coverage hint.

### Validation on save

| Rule                                         | Error (examples)                             |
| -------------------------------------------- | -------------------------------------------- |
| Confirmed MapTiler city/state + radius       | `Choose a suggested location to confirm it`  |
| Shop or Both → street required               | `Shop street address is required`            |
| Shop or Both → city, state, and ZIP required | `Shop address requires city, state, and ZIP` |

Save errors route to tabs via `tabForSaveErrors()` in `EditProfileTabNav.tsx` (shop/location → **Booking**, generic location → **Details**).

### Persist path

1. `EditBusinessProfile` validates coverage, then `savePrimaryServiceArea()` → `POST /api/business-profile/service-area` (upserts `business_service_areas`, syncs `service_area` / ZIP)
2. `saveBusinessProfile()` in `utils/editing/editingHelpers.ts`
3. `validateEditingForm()` in `utils/editing/editingValidation.ts`
4. `transformFormDataForAPI()` merges `serviceLocationPersistFromUi()`
5. `BusinessProfileApi.updateBusinessProfile()`

When mode is `mobile_only`, shop street/unit are saved as `null`.

---

## Code map

| Area                                      | Path                                                 |
| ----------------------------------------- | ---------------------------------------------------- |
| Location + mode helpers (import barrel)   | `utils/location/index.ts`                            |
| City/state/ZIP parse, format, validate    | `utils/businessLocation.ts`                          |
| Mode UI state, hydrate, persist, validate | `utils/serviceLocationMode.ts`                       |
| Shared city/state/ZIP inputs              | `components/ProfileLocationFields.tsx`               |
| Booking tab card                          | `components/DashboardProfileServiceLocationCard.tsx` |
| Details tab location                      | `components/edit/sections/BusinessInfoSection.tsx`   |
| Coverage editor (MapTiler + radius)       | `components/DashboardProfileCoverageCard.tsx`        |
| Primary service area loader               | `server/loadPrimaryServiceArea.ts`                   |
| Form types                                | `utils/editing/editingTypes.ts`                      |
| Form validation (no API deps)             | `utils/editing/editingValidation.ts`                 |
| Save + transform                          | `utils/editing/editingHelpers.ts`                    |
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

- **`formatProfileLocationLabel(city, state, zip)`** — e.g. `"Austin, TX 78660"`
- **`formatFullShopAddress({ street, unit, city, state, zip })`** — e.g. `"123 Main St, Suite 4, Austin, TX 78660"`
- **`shopAddressIsOffered(mode)`** — true for `shop_only` and `both`
- **`mobileServiceIsOffered(mode)`** — true for `mobile_only` and `both`

Parse city/state from DB: `parseServiceAreaCityState(profile.service_area)`.

---

## Public booking link

**Status:** Implemented on `/:slug/book`. The flow reads `service_location_mode` and shop fields from `business_profiles` and branches accordingly.

| `service_location_mode` | Customer experience                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `mobile_only`           | Service details → visit calendar → **contact + address** (one screen) → vehicle/notes → review                          |
| `shop_only`             | Service details → visit calendar → contact → vehicle/notes → review (shop address prefilled on submit)                  |
| `both`                  | Price / add-ons (combined) → **mobile vs shop** on `/book/details` → visit calendar → contact (+ address if mobile) → … |

Location choice is collected **before date/time** on `/book/details` when mode is `both` (and as a pre-schedule step on `/book` for custom owner jobs that skip details). Query param: `serviceLocationType=mobile|shop`.

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

| File                                    | Covers                                            |
| --------------------------------------- | ------------------------------------------------- |
| `testing/businessLocation.test.ts`      | ZIP/city validation, `formatFullShopAddress`      |
| `testing/serviceLocationMode.test.ts`   | Hydrate, persist, shop validation                 |
| `testing/validateEditingForm.test.ts`   | Full form + shop rules                            |
| `testing/publicServiceLocation.test.ts` | Public booking location builder + mode resolution |

Run: `npm test -- src/features/business-profile/testing/`

---

## Quick QA checklist (dashboard)

- **Mobile only:** save without shop street; MapTiler city/state + radius required.
- **Shop only:** street + city/state/ZIP required; unit optional.
- **Both:** same shop rules; mobile hint shows city/state + radius from Details.
- Edit coverage in **Details**, open **Booking** → hint and shop city match.
- Switch Shop → Mobile → save → `shop_street_address` and `shop_unit` cleared in DB.
- Profile completion checklist includes **Service area**.
- Public booking link header shows `City, ST · 25 mi` (no coordinates).

---

## Profile completion tracker

`ProfileCompletionTracker` checks city/state from the primary service area (or legacy `service_area`). ZIP is optional for mobile. Shop street is not a separate checklist item today.
