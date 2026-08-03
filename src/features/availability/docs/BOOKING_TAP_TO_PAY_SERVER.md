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

| Method | Path                                                          | Handler                                                            |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `POST` | `/api/payments/tap-to-pay/connection-token`                   | `payments/tap-to-pay/connection-token/route.ts` (merchant warm-up) |
| `POST` | `/api/availability/bookings/{id}/tap-to-pay/connection-token` | `connection-token/route.ts`                                        |
| `POST` | `/api/availability/bookings/{id}/tap-to-pay/intent`           | `intent/route.ts`                                                  |
| `POST` | `/api/availability/bookings/{id}/tap-to-pay/client-event`     | `client-event/route.ts` → `recordTapToPayClientEvent.ts`           |
| `POST` | `/api/availability/bookings/{id}/actions`                     | `handleJobCompletedAction.ts` (PI verify)                          |

### Client diagnostic events

`POST …/tap-to-pay/client-event` — best-effort mobile report after Tap to Pay success or failure. No Stripe calls. Updates `booking_tap_to_pay_intents` client\_\* columns when `paymentIntentId` matches a row for that booking + business.

- Auth: same Bearer JWT as intent / connection-token
- Missing or orphan `paymentIntentId` → `200 { success: true, updated: false }` (never 500)
- Match → sets `client_stage`, `client_diagnostics`, `client_duration_ms`, bumps `client_report_count`; failure also sets `client_error_*`; success sets `client_success_at` without clearing prior errors
- Handler: `recordTapToPayClientEvent.ts`

### Merchant warm-up connection token

`POST /api/payments/tap-to-pay/connection-token` — no booking id, no PaymentIntent. Mobile calls on app launch / foreground when the merchant is already signed in.

- Auth: `Authorization: Bearer <supabase_jwt>` (same as booking Tap to Pay routes)
- Body (optional): `{ "stripeAccountId": "acct_…" }` — **403** if mismatch
- Gates: `onboarding_status === 'complete'`, `charges_enabled === true`, terminal location via `ensureTerminalLocation`
- Response: `{ "success": true, "secret": "pst_…" }` + `X-Request-ID` header
- Stripe: `issueTapToPayConnectionToken` (same as booking connection-token)

### Rate limiting

`ownerTapToPayRateLimit.ts` — per user + per IP, burst + hourly (Upstash when configured).

| Route bucket                          | Burst (1 min)      | Hourly               | Notes                           |
| ------------------------------------- | ------------------ | -------------------- | ------------------------------- |
| Connection token (merchant + booking) | 40 / user, 80 / IP | 240 / user, 480 / IP | Tolerates warm-up + SDK refresh |
| PaymentIntent create                  | 15 / user, 30 / IP | 80 / user, 160 / IP  | Each retry creates a new PI     |

**429** + `Retry-After` + `"Too many Tap to Pay requests. Please wait a moment and try again."`

### Payment verification

`verifyTapToPayPaymentIntent` compares Stripe PI amount to **`booking_tap_to_pay_intents.amount_cents`** (server record from intent create), not the mobile `sessionPayment.amountCents` body field.

`job_completed` rejects when `amountDueCents !== 0` (under- or over-payment vs server math).

## Stripe

- Uses the business **Connect account** (`payment_accounts.stripe_account_id`).
- All Connect-scoped Stripe calls use `getStripeConnectClient(acct_…)` (`Stripe-Account` header on every request).
- **Terminal Location** (`payment_accounts.stripe_terminal_location_id`) — created server-side via `ensureTerminalLocation()`; required for in-person Tap to Pay. Not created automatically when Connect finishes.
- PaymentIntent: `payment_method_types: ['card_present']`, `capture_method: 'automatic'`.
- Metadata: `kind=booking_tap_to_pay`, `bookingId`, `businessId`.
- **No** Stripe Checkout Session.

## Terminal Location provisioning

| Trigger                                                       | Handler                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Connect onboarding sync when `onboarding_status === complete` | `syncConnectPaymentAccountForBusiness` → `ensureTerminalLocation` |
| Every `POST …/tap-to-pay/intent` (safety net)                 | `intent/route.ts` → `ensureTerminalLocation`                      |
| Every `POST …/tap-to-pay/connection-token`                    | `connection-token/route.ts` → `ensureTerminalLocation`            |

Intent success response includes `terminalLocationId`, `stripeAccountId`, and `merchantDisplayName` for the mobile Terminal SDK.

## Code map

| Concern                   | File                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| Shared types              | `tapToPayTypes.ts`                                                                |
| Auth                      | `resolveTapToPayRouteAuth.ts`                                                     |
| Client diagnostics        | `recordTapToPayClientEvent.ts`                                                    |
| Preconditions             | `resolveTapToPayBookingContext.ts`                                                |
| Terminal Location         | `ensureTerminalLocation.ts`, `buildTerminalLocationAddress.ts` (payments feature) |
| Connection token body     | `parseTapToPayConnectionTokenBody.ts`                                             |
| Merchant warm-up handler  | `handleMerchantTapToPayConnectionToken.ts`                                        |
| Shared token issuance     | `issueTapToPayConnectionToken.ts`                                                 |
| Direct-charge scope check | `verifyTapToPayDirectChargeOnConnectedAccount.ts`                                 |
| Verify PI (complete)      | `verifyTapToPayPaymentIntent.ts`                                                  |
| Complete action           | `handleJobCompletedAction.ts`                                                     |
| Persist                   | `persistJobCompletedTransaction.ts`                                               |
| SQL migration             | `docs/sql/booking_tap_to_pay_phase2_migration.sql`                                |

## Connect account alignment (Tap to Pay + Connect)

For in-person Tap to Pay on a **connected merchant**, these must all be created on the **same** Connect account (`acct_…`) via `getStripeConnectClient(acct_…)`:

| Object            | Stripe API                                                            |
| ----------------- | --------------------------------------------------------------------- |
| Terminal Location | `connectClient.terminal.locations.create(…)`                          |
| Connection token  | `connectClient.terminal.connectionTokens.create({ location: tml_… })` |
| PaymentIntent     | `connectClient.paymentIntents.create(…)`                              |

Use **direct charges** on the connected account. Do **not** create a platform PaymentIntent with `on_behalf_of` / `transfer_data` for Tap to Pay.

After PI creation, `verifyTapToPayDirectChargeOnConnectedAccount` confirms:

- PI is retrievable on the connected account
- PI is **not** retrievable on the platform account
- PI has no `on_behalf_of` or `transfer_data.destination`

### Troubleshooting

If collection fails with `INVALID_REQUIRED_PARAMETER` / `on_behalf_of`:

1. Confirm PI + connection token are on the **connected account** (direct charges).
2. Mobile must **not** pass `onBehalfOf` to `easyConnect` for direct charges.
3. Scope verification returns **500** on intent if a platform-scoped PI is created.
