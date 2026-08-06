# Contract: Public multi-job booking (one visit)

**Status:** Implemented (web public book link).  
**Related:** [`mobile-owner-create-booking-multi-job.md`](./mobile-owner-create-booking-multi-job.md)

Customers can book **1…4 catalog services** on one appointment (e.g. two cars). Same model as owner multi-job: one `bookings` row, `job_details` line items, duration = sum of jobs.

## Product rules

| Rule                   | Value                                      |
| ---------------------- | ------------------------------------------ |
| Max jobs (public)      | 4                                          |
| Custom jobs            | Not allowed (catalog `serviceId` required) |
| Location               | One for the whole visit                    |
| Payment / promo / sale | Once on appointment subtotal               |
| Free-tier              | +1 per visit (not per job)                 |
| Vehicles               | Required for vehicle-related business types (`Auto & Detailing`, `Mobile Repair`); per job on multi-job visits |

## Flow

Collapsed for fewer full-screen hops. Progress indicator: **Service → Time → Details → Confirm**.

1. **`/book`** — pick a service (select, then Continue). Optional collapsible **See description**.  
   - If this tab already has an unfinished visit cart: show **Continue booking** / **Start over** (never silent resume onto confirm).  
   - **Add another** uses `?addJob=1` and keeps the cart.
2. **`/book/details`** — pricing option + optional add-ons on one screen (add-ons appear after a price option is chosen when multi-price is on). Location choice (`both`) stays a separate phase. CTA label is **Continue**.
3. Continue commits the job to the **sessionStorage cart** → **`/book?visit=1`**.
4. **Visit** (`/book?visit=1`):
   - **Schedule** first (quick “next available” card, or full calendar). Slot length = sum of job durations.
   - **Contact** (+ service address on the same screen when mobile).
   - **Vehicle** (per job when vehicle-related; required for public customers) + notes.
   - **Review** → payment / confirm.
5. **Add another** from vehicles or review → picker with `?addJob=1` → details → back to visit. If the saved start no longer fits, show retime and force schedule.  
   **Edit sole service** from visit back uses `?editVisit=1` so contact/schedule draft is kept; a fresh service pick without that flag clears the cart.
6. Confirm → `POST /api/public/bookings` with `jobs[]` (or Stripe checkout with the same payload).

## Session cart

- Storage: `sessionStorage` key `servicelink.publicBookingJobsCart.v1:{slug}` (`publicBookingJobsCart.ts`).
- Holds `jobs[]`, optional `serviceLocationType`, and `visitDraft` (contact, slot, step) so add-another / cancel doesn’t wipe progress.
- After a successful booking (including Stripe return), the cart is cleared.

## API

Same endpoints as single-job: `POST /api/public/bookings` and `POST /api/public/booking-checkout`.

When `jobs` is present (and `ownerManualBooking` is not true):

- Each job must include catalog `serviceId`
- Max **4** jobs
- Top-level `serviceName` / `durationMinutes` / customer vehicle are omitted (vehicles on each job)
- For vehicle-related businesses, each job’s year/make/model is required
- Promo codes allowed; sale applies once to visit gross

Owner multi-job behavior is unchanged (`ownerManualBooking: true`, custom jobs allowed, up to 20).

## Customer + assets

`createBooking` upserts **`customers`** and, for complete vehicles, **`customer_assets`** (`asset_type = vehicle`). Public book UI does **not** yet suggest saved vehicles (deferred); persistence still runs on create so returning-customer UX can use it later. See [`src/features/customer-management/docs/FEATURE.md`](../../src/features/customer-management/docs/FEATURE.md).
