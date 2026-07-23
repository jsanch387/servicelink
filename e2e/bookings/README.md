# Booking flows — E2E

**In scope:**

- Public booking happy paths for an **active sale** and **active promo code**.
- Public booking **flow smoke** for `blacklabelauto` (through review / payment entry — no Stripe submit).
- Authenticated owner appointment creation for **custom jobs** and **catalog services**, including optional customer fields, notes, pricing options, add-ons, persistence, and `booking_source`.

**Out of scope:** Stripe Checkout redirect, redemption Uses count at job completion, stacking edge cases, and delivery assertions against third-party email providers.

Product rules: `src/features/marketing/docs/FLOWS.md`

---

## Prerequisites

1. `.env.e2e.local` with owner credentials (same as marketing E2E).
2. Optional: `E2E_PUBLIC_BUSINESS_SLUG` — if omitted, tests resolve the slug from `/api/dashboard/data` after owner login.
3. For the **sale-on-review** case in `public-booking-flow.spec.ts`, `blacklabelauto` should already have an **active sale** (the suite asserts the public notice — it does not create/delete Marketing sales).
4. Test business should be **Pro**, have ≥1 bookable service with availability.
5. Discount confirm specs temporarily disable deposits via `/api/payments/servicelink/settings` so confirm can finish without Stripe, then restore deposits. Flow smoke does **not** confirm and does not touch deposits.

---

## Manual regression checklist

### Sale

- [ ] Create active sale (no date range is fine) on Marketing
- [ ] Open `/{slug}/book` → pick service → date/time
- [ ] See `{sale} — {discount} applies` on schedule / review
- [ ] Confirm booking → success shows the same sale line

### Promo

- [ ] Create active promo on Marketing
- [ ] Book through customer details
- [ ] On payment (or review if payment skipped): enter code → **Apply**
- [ ] See `Code {CODE} applied` and discounted total
- [ ] Confirm booking → **You're booked**

### Public flow smoke (`blacklabelauto`)

- [ ] `/blacklabelauto/book` → service → price/add-ons/location when shown → date/time → details → review
- [ ] Stop before Confirm / Stripe
- [ ] With an active sale, review shows `{sale} — {discount} applies`

---

## Automated specs

| File                                 | Test                      | Covers                                                                                                              |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `public-booking-flow.spec.ts`        | Flow to review            | Adaptive price / add-ons / location → schedule → details → review (no submit)                                       |
| `public-booking-flow.spec.ts`        | Sale on review            | Public book → assert existing active sale notice on review → stop                                                   |
| `public-booking-discounts.spec.ts`   | Active sale auto-applies  | Marketing create → public book → assert sale notice → confirm                                                       |
| `public-booking-discounts.spec.ts`   | Promo at checkout         | Marketing create → public book → apply promo → confirm                                                              |
| `owner-appointment-creation.spec.ts` | Custom owner job          | Owner choice → custom name/price/duration/notes → optional email/vehicle → submit payload → persisted owner booking |
| `owner-appointment-creation.spec.ts` | Catalog owner appointment | Service → pricing option/add-on when configured → customer/vehicle/notes → persisted snapshots                      |

Helpers: `e2e/fixtures/booking-helpers.ts`, `e2e/fixtures/marketing-helpers.ts`

Run:

```bash
npm run test:e2e -- e2e/bookings/public-booking-flow.spec.ts
npm run test:e2e -- e2e/bookings/public-booking-discounts.spec.ts
npm run test:e2e -- e2e/bookings/owner-appointment-creation.spec.ts
```
