# Marketing — promo codes & sales

**Start here:** [FLOWS.md](./FLOWS.md) for product rules and end-to-end behavior.  
**Schema:** [DATABASE.md](./DATABASE.md) for tables, booking columns, RLS, and migrations.

## Status

| Layer                                            | Status                                       |
| ------------------------------------------------ | -------------------------------------------- |
| Dashboard UI (list, create, success screens)     | ✅ Built (Zustand mock store — session only) |
| Edit routes                                      | ❌ Not built                                 |
| Database & migrations                            | ❌ Not built                                 |
| Server actions / API                             | ❌ Not built                                 |
| Pro gating                                       | ❌ Not built                                 |
| Public booking — promo field & sale auto-apply   | ❌ Not built                                 |
| Job completion — discount breakdown & redemption | ❌ Not built                                 |
| Owner-created booking — optional promo           | ⏳ Phase 2 (after public booking)            |
| Quotes                                           | ⏳ Out of scope for v1                       |

## Product summary (v1)

- **Pro-only** — Free / lapsed Pro users see **read-only** cards; no create, edit, toggle, or new redemptions.
- **Promo codes** — Customer enters at booking; **one use per customer per code** (phone first, email fallback).
- **Sales** — **One active sale** per business; **auto-applied at booking** when **service date** falls in the sale window (business timezone).
- **One discount per booking** — Promo code wins if valid; else qualifying sale. **Never stack** code + sale.
- **Deposit** — Calculated on **pre-discount** subtotal (unchanged from today).
- **Discount dollars** — Applied at **job completion** (final collection), not at deposit.
- **Reschedule** — Re-run eligibility on **new service date**; update or clear attached discount.
- **Honor at completion** — If booked with a valid discount snapshot, honor at completion when **service date still qualifies**, even if owner deactivated the code/sale same day.

## App code (today)

| Path                                    | Role                                  |
| --------------------------------------- | ------------------------------------- |
| `../components/MarketingPage.tsx`       | List + tabs                           |
| `../components/CreatePromoCodePage.tsx` | Create promo + success                |
| `../components/CreateSalePage.tsx`      | Create sale + success                 |
| `../stores/marketingStore.ts`           | UI-only mock state (replace with API) |
| `../types/index.ts`                     | Form + domain types                   |
| `src/app/dashboard/marketing/`          | Routes                                |
| `../../../../e2e/marketing/`            | E2E regression checklist + specs      |

## Related docs

- [Pro vs Free access](../../../../docs/subscription-and-pro-features.md) — add Marketing row when gating ships
- [Bookings table](../../availability/docs/BOOKINGS_TABLE.md) — discount columns extend this model
- [Mobile job completed](../../../../docs/contracts/mobile-booking-job-completed.md) — completion payment breakdown (future)

## Implementation phases

1. **Phase 1 — Dashboard + data** — Migrations, RLS, server actions, Pro gate, replace Zustand, edit routes, remove max-uses from UI.
2. **Phase 2 — Public booking** — Validate promo, auto-apply sale, persist discount snapshot on booking.
3. **Phase 3 — Completion** — Breakdown UI, redemption write, honor rules.
4. **Phase 4 — Owner booking** — Optional promo on `?for=owner` flow.
5. **Later** — Quotes, emails with discount line, owner override at completion.
