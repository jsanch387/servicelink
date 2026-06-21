# Tap to Pay — server behavior (Phase 2)

**Canonical mobile contract:** [`docs/contracts/mobile-booking-tap-to-pay.md`](../../../../docs/contracts/mobile-booking-tap-to-pay.md)

**DB migration (required before prod):** [`docs/sql/booking_tap_to_pay_phase2_migration.sql`](../../../../docs/sql/booking_tap_to_pay_phase2_migration.sql)

## Scope

Phase 2 adds Stripe **Tap to Pay on iPhone** to the mobile Complete sheet:

1. Mobile initializes Terminal SDK with a **connection token**.
2. Mobile requests a **PaymentIntent** for the current amount due (+ session fees).
3. Customer taps card on-device; SDK confirms the PaymentIntent.
4. Mobile sends existing **`job_completed`** with `tap_to_pay` + `stripePaymentIntentId`.
5. Server verifies the PaymentIntent with Stripe, then runs the Phase 1 persist pipeline.

**Mark as paid** (`cash` / `payment_app` / `other`) is unchanged.

## Endpoints

| Method | Path                                                          | Handler                                   |
| ------ | ------------------------------------------------------------- | ----------------------------------------- |
| `POST` | `/api/availability/bookings/{id}/tap-to-pay/connection-token` | `connection-token/route.ts`               |
| `POST` | `/api/availability/bookings/{id}/tap-to-pay/intent`           | `intent/route.ts`                         |
| `POST` | `/api/availability/bookings/{id}/actions`                     | `handleJobCompletedAction.ts` (PI verify) |

## Stripe

- Uses the business **Connect account** (`payment_accounts.stripe_account_id`).
- **Terminal Location** (`payment_accounts.stripe_terminal_location_id`) — created server-side via `ensureTerminalLocation()`; required for in-person Tap to Pay. Not created automatically when Connect finishes.
- PaymentIntent: `payment_method_types: ['card_present']`, `capture_method: 'automatic'`.
- Metadata: `kind=booking_tap_to_pay`, `bookingId`, `businessId`.
- **No** Stripe Checkout Session.

## Terminal Location provisioning

| Trigger                                                       | Handler                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Connect onboarding sync when `onboarding_status === complete` | `syncConnectPaymentAccountForBusiness` → `ensureTerminalLocation` |
| Every `POST …/tap-to-pay/intent` (safety net)                 | `intent/route.ts` → `ensureTerminalLocation`                      |

Intent success response includes `terminalLocationId`, `stripeAccountId`, and `merchantDisplayName` for the mobile Terminal SDK.

## Code map

| Concern           | File                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| Shared types      | `tapToPayTypes.ts`                                                                |
| Auth              | `resolveTapToPayRouteAuth.ts`                                                     |
| Preconditions     | `resolveTapToPayBookingContext.ts`                                                |
| Terminal Location | `ensureTerminalLocation.ts`, `buildTerminalLocationAddress.ts` (payments feature) |
| Connection token  | `createTapToPayConnectionToken.ts`                                                |
| Create PI         | `createBookingTapToPayIntent.ts`                                                  |
| PI status mapping | `mapStripePaymentIntentStatus.ts`                                                 |
| Verify PI         | `verifyTapToPayPaymentIntent.ts`                                                  |
| Complete action   | `handleJobCompletedAction.ts`                                                     |
| Persist           | `persistJobCompletedTransaction.ts`                                               |
| SQL migration     | `docs/sql/booking_tap_to_pay_phase2_migration.sql`                                |
