# Public booking discounts — E2E

**In scope:** Public booking happy paths for an **active sale** (auto-apply) and an **active promo code** (enter at checkout).

**Out of scope:** Stripe Checkout redirect, redemption Uses count at job completion, owner manual booking, stacking edge cases.

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

File: `public-booking-discounts.spec.ts`

| Test                     | Covers                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| Active sale auto-applies | Marketing create → public book → assert sale notice → confirm (no Stripe) |
| Promo at checkout        | Marketing create → public book → apply code → confirm                     |

Helpers temporarily disable deposits so confirm can finish without Stripe Checkout, then restore them.

Helpers: `e2e/fixtures/booking-helpers.ts`, `e2e/fixtures/marketing-helpers.ts`

Run:

```bash
npm run test:e2e -- e2e/bookings/public-booking-discounts.spec.ts
```
