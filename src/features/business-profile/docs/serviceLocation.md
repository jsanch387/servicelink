# Service location (mobile / shop / both)

How a business defines **where** service happens: mobile (you go to the customer), shop (they come to you), or both. Used in dashboard profile **edit → Booking** tab and stored on `business_profiles` for the public booking link (customer address branching is documented below as **planned**).

---

## Source of truth (database)

Migrations:

- `supabase/migrations/20250630120000_add_business_zip.sql`
- `supabase/migrations/20250630130000_add_service_location_and_shop_address.sql`

| Column | Type | Purpose |
| --- | --- | --- |
| `service_area` | `text` | **City + state** as `"City, ST"` (existing column) |
| `business_zip` | `text` | **US ZIP** (5 digits). **Required** on profile save |
| `service_location_mode` | `text` | `mobile_only` \| `shop_only` \| `both`. Default `mobile_only` |
| `shop_street_address` | `text` | Street where customers visit (shop / both) |
| `shop_unit` | `text` | Optional suite or unit |

**Not duplicated:** city, state, and ZIP are **not** stored again on shop fields. Shop address = `shop_street_address` + optional `shop_unit` + profile `service_area` + `business_zip`.

---

## Mental model

```
Profile location (always)
  service_area  →  "Austin, TX"
  business_zip  →  "78660"

When mode is shop_only or both
  shop_street_address  →  "123 Main St"
  shop_unit            →  "Suite 4" (optional)

Full shop display  →  formatFullShopAddress({ street, unit, city, state, zip })
Mobile service area → formatProfileLocationLabel(city, state, zip)
```

One base location per business. Mobile jobs and shop visits share city/state/ZIP; only street/unit are shop-specific.

---

## Dashboard edit UI

**Route:** `/dashboard/business-profile?mode=edit` → **Booking** tab.

| Control | Maps to |
| --- | --- |
| Service type: Mobile / Shop / Both | `service_location_mode` |
| Shop → Street, Unit | `shop_street_address`, `shop_unit` |
| Shop → City, State, ZIP | `service_area`, `business_zip` (same as **Details** tab) |

City/state/ZIP also appear under **Details → Location**. Both tabs edit the same fields.

### Validation on save

| Rule | Error (examples) |
| --- | --- |
| City, state, ZIP required for every profile | `City and state are required`, `ZIP is required` |
| Shop or Both → street required | `Shop street address is required` |
| Shop or Both → full profile location required | `Shop address requires city, state, and ZIP` |

Save errors route to tabs via `tabForSaveErrors()` in `EditProfileTabNav.tsx` (shop/location → **Booking**, generic location → **Details**).

### Persist path

1. `EditBusinessProfile` → `saveBusinessProfile()` in `utils/editing/editingHelpers.ts`
2. `validateEditingForm()` in `utils/editing/editingValidation.ts`
3. `transformFormDataForAPI()` merges `serviceLocationPersistFromUi()`
4. `BusinessProfileApi.updateBusinessProfile()`

When mode is `mobile_only`, shop street/unit are saved as `null`.

---

## Code map

| Area | Path |
| --- | --- |
| Location + mode helpers (import barrel) | `utils/location/index.ts` |
| City/state/ZIP parse, format, validate | `utils/businessLocation.ts` |
| Mode UI state, hydrate, persist, validate | `utils/serviceLocationMode.ts` |
| Shared city/state/ZIP inputs | `components/ProfileLocationFields.tsx` |
| Booking tab card | `components/DashboardProfileServiceLocationCard.tsx` |
| Details tab location | `components/edit/sections/BusinessInfoSection.tsx` |
| Form types | `utils/editing/editingTypes.ts` |
| Form validation (no API deps) | `utils/editing/editingValidation.ts` |
| Save + transform | `utils/editing/editingHelpers.ts` |
| Supabase types | `src/libs/supabase/client.ts` → `business_profiles` |

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

## Public booking link (planned behavior)

**Status:** Profile data is stored and editable; the **public** `/:slug/book` flow does **not** yet branch on `service_location_mode`. Today every booking still collects the customer address on the address step.

Intended behavior when implemented:

| `service_location_mode` | Customer address step |
| --- | --- |
| `mobile_only` | Required — customer enters where service happens |
| `shop_only` | Skip or read-only — show `formatFullShopAddress(...)` from business profile |
| `both` | Customer chooses mobile vs shop; address required only for mobile |

**Touch points for implementation:**

- `src/features/availability/booking/components/AvailabilityBookingPage.tsx`
- `src/features/availability/booking/components/CustomerForm.tsx` (`address` step)
- `POST /api/public/bookings` — validate address rules server-side to match mode
- Public book page SSR — load `service_location_mode`, `shop_street_address`, `shop_unit`, `service_area`, `business_zip`

See also: `src/features/availability/docs/FLOWS.md` §2 (public V2 booking).

---

## Tests

| File | Covers |
| --- | --- |
| `testing/businessLocation.test.ts` | ZIP/city validation, `formatFullShopAddress` |
| `testing/serviceLocationMode.test.ts` | Hydrate, persist, shop validation |
| `testing/validateEditingForm.test.ts` | Full form + shop rules |
| `testing/editProfileTabNav.test.ts` | Error → tab routing |

Run: `npm test -- src/features/business-profile/testing/`

---

## Quick QA checklist (dashboard)

- **Mobile only:** save without shop street; city/state/ZIP still required.
- **Shop only:** street + city/state/ZIP required; unit optional.
- **Both:** same shop rules; mobile hint shows shared city/state/ZIP.
- Edit city in **Details**, open **Booking** → shop city matches.
- Edit city in **Booking** shop section, open **Details** → location matches.
- Switch Shop → Mobile → save → `shop_street_address` and `shop_unit` cleared in DB.
- Profile completion checklist includes **City, state + ZIP**.

---

## Profile completion tracker

`ProfileCompletionTracker` checks `business_zip` in addition to city/state from `service_area`. Shop street is not a separate checklist item today (mode defaults to mobile).
