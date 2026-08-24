# Create payment Tap to Pay (v1)

Owner-created in-person charge. Not a booking. Product name is **Create payment → Tap to pay**. Code still lives under `src/features/payments/walk-up/`.

Mobile: Home FAB → Create payment → Tap to pay.  
Contract: [`docs/contracts/mobile-create-payment-tap-to-pay.md`](../../../../docs/contracts/mobile-create-payment-tap-to-pay.md)  
Table: [`PAYMENT_REQUESTS_TABLE.md`](./PAYMENT_REQUESTS_TABLE.md)

## Sequence

```text
Owner (mobile)
  → POST /api/payments/tap-to-pay/connection-token   (warm-up; already shipped)
  → POST /api/payments/tap-to-pay/intent  { amountCents, currency?, note, stripeAccountId? }
       → Connect gate + optional stripeAccountId match
       → ensureTerminalLocation(businessId)
       → insert payment_requests (status open, collection_method tap_to_pay)
       → PaymentIntent on connected account
            payment_method_types: ['card_present']
            capture_method: automatic
            metadata.kind = walkup_tap_to_pay
       → store stripe_payment_intent_id
       → return { clientSecret, terminalLocationId, stripeAccountId, … }
  → Stripe Terminal / Apple Tap to Pay
  → Owner toast “Paid”

Stripe → POST /api/stripe/webhook-connect
  → payment_intent.succeeded
       → applyWalkUpTapToPayPaymentIntent → status = paid
  → payment_intent.canceled / payment_failed
       → canceled / failed
```

Mobile does **not** call a second complete route. Unused PIs (owner backs out) may expire; the open row is fine.

## Gates

- Authenticated owner (Bearer or cookie)
- `payment_accounts`: onboarding `complete`, `charges_enabled`, `stripe_account_id`
- Direct charges on the connected account (`Stripe-Account`)
- Amount `50`–`999999` cents, currency `usd`, required note
- If body `stripeAccountId` is sent, it must match `payment_accounts.stripe_account_id`
- Rate limit: same intent windows as booking Tap to Pay

Does **not** require `payment_settings.payments_enabled`. Does **not** write `booking_payments`. Does **not** call `job_completed`.

## Reuse

| Already exists                                              | Reuse                                      |
| ----------------------------------------------------------- | ------------------------------------------ |
| Booking `createBookingTapToPayIntent` PI options            | `card_present` + automatic capture         |
| `ensureTerminalLocation`                                    | Before creating the PI                     |
| `POST /api/payments/tap-to-pay/connection-token`            | App warm-up                                |
| `resolveMerchantTapToPayPaymentAccount`                     | Connect gate                               |
| `verifyTapToPayDirectChargeOnConnectedAccount`              | Direct-charge check                        |
| `payment_requests`                                          | Same ad-hoc ledger as payment links        |

## Stripe Dashboard

Connect webhook (`/api/stripe/webhook-connect`) must include:

- `payment_intent.succeeded`
- `payment_intent.canceled`
- `payment_intent.payment_failed`

Booking Tap to Pay PIs use `metadata.kind = booking_tap_to_pay` and are ignored here.

## Not in this pass

Customer receipt / SMS / review invite, CRM customer, Android Tap to Pay, in-app paid list.
