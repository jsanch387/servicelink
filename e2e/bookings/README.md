# Booking flows — E2E

**In scope:**

- Public booking happy paths for an **active sale** and **active promo code**.
- Authenticated owner appointment creation for **custom jobs** and **catalog services**, including optional customer fields, notes, pricing options, add-ons, persistence, and `booking_source`.

**Out of scope:** Stripe Checkout redirect, redemption Uses count at job completion, stacking edge cases, and delivery assertions against third-party email providers.

Product rules: `src/features/marketing/docs/FLOWS.md`

---

## Prerequisites

1. `.env.e2e.local` with owner credentials (same as marketing E2E).
2. Optional: `E2E_PUBLIC_BUSINESS_SLUG` — if omitted, tests resolve the slug from `/api/dashboard/data` after owner login.
3. Test business should be **Pro**, have ≥1 bookable service with availability.
4. Specs temporarily disable deposits via `/api/payments/servicelink/settings` so confirm can finish without Stripe, then restore deposits.

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

---

## Automated specs

| File                                 | Test                      | Covers                                                                                                              |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `public-booking-discounts.spec.ts`   | Active sale auto-applies  | Marketing create → public book → assert sale notice → confirm                                                       |
| `public-booking-discounts.spec.ts`   | Promo at checkout         | Marketing create → public book → apply promo → confirm                                                              |
| `owner-appointment-creation.spec.ts` | Custom owner job          | Owner choice → custom name/price/duration/notes → optional email/vehicle → submit payload → persisted owner booking |
| `owner-appointment-creation.spec.ts` | Catalog owner appointment | Service → pricing option/add-on when configured → customer/vehicle/notes → persisted snapshots                      |

Helpers temporarily disable deposits so confirm can finish without Stripe Checkout, then restore them.

Helpers: `e2e/fixtures/booking-helpers.ts`, `e2e/fixtures/marketing-helpers.ts`

Run:

```bash
npm run test:e2e -- e2e/bookings/public-booking-discounts.spec.ts
npm run test:e2e -- e2e/bookings/owner-appointment-creation.spec.ts
```
