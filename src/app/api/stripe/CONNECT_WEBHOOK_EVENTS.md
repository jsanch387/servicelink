# Stripe Connect webhook events

Source of truth for **which Stripe events the Connect destination must send** to `POST /api/stripe/webhook-connect`.

Scanned from `src/app/api/stripe/webhook/route.ts` (shared handler) and every Connect charge path. Update this file when you add a new Connect product or webhook branch.

Two destinations, different scopes:

| Destination                         | URL                           | Stripe scope                  | Env secret                      |
| ----------------------------------- | ----------------------------- | ----------------------------- | ------------------------------- |
| Platform (ServiceLink Pro billing)  | `/api/stripe/webhook`         | **Your account**              | `STRIPE_WEBHOOK_SECRET`         |
| Connect (merchant / customer money) | `/api/stripe/webhook-connect` | **Connected and v2 accounts** | `STRIPE_CONNECT_WEBHOOK_SECRET` |

All live customer charges are **direct charges** on the connected account (`stripe.checkout.sessions.create` / PaymentIntents with `{ stripeAccount }`). Those events only arrive on the Connect destination.

---

## Connect destination — required list

Select **all** of these on the destination whose URL is `https://myservicelink.app/api/stripe/webhook-connect` (and the same list in test mode).

| Event                           | Required | Why                                                                                                                      |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `checkout.session.completed`    | **Yes**  | Booking checkout, membership signup, maintenance card enroll, create-payment links                                       |
| `checkout.session.expired`      | **Yes**  | Create-payment links: mark `payment_requests` expired after 24h                                                          |
| `payment_intent.succeeded`      | **Yes**  | Create-payment Tap to Pay → `payment_requests` paid                                                                      |
| `payment_intent.canceled`       | **Yes**  | Create-payment Tap to Pay → canceled                                                                                     |
| `payment_intent.payment_failed` | **Yes**  | Create-payment Tap to Pay → failed                                                                                       |
| `invoice.paid`                  | **Yes**  | Membership renewal: ledger + customer receipt. First Checkout invoice is skipped for the receipt (`subscription_create`) |
| `invoice.payment_failed`        | **Yes**  | Membership dunning email + `last_payment_failed_at`                                                                      |
| `customer.subscription.updated` | **Yes**  | Membership period sync + next-visit email/SMS + owner nudge                                                              |
| `customer.subscription.deleted` | **Yes**  | Membership ended → cancel email + status                                                                                 |

If any required event is missing, Stripe still charges the card and our app stays silent (same failure mode as the weekly membership renewal).

---

## Per product

Handler is one route. It branches on `event.type`, then on Stripe `metadata.kind` (or invoice/subscription membership lookup).

### Availability booking checkout

- Create: `POST /api/public/booking-checkout` → Checkout `mode: payment` on Connect
- Metadata: `kind = booking_checkout`
- **Needs:** `checkout.session.completed`
- Creates the `bookings` row only after this event (plus emails / SMS)
- Docs: `src/features/payments/docs/BOOKING_CHECKOUT_FLOW.md`

### Memberships (customer subscriptions)

- Create: `POST /api/public/memberships/checkout` → Checkout `mode: subscription` on Connect
- Metadata: `kind = membership_checkout` (copied onto the Stripe Subscription)
- **Needs:** `checkout.session.completed` (first visit + confirm emails)
- **Needs:** `invoice.paid` / `invoice.payment_failed` (renewal receipt / fail email)
- **Needs:** `customer.subscription.updated` (period + “book next visit”)
- **Needs:** `customer.subscription.deleted` (canceled)
- Docs: `src/features/subscriptions/docs/FLOWS.md`

### Maintenance enrollment (card)

- Create: `POST /api/public/maintenance-enrollment/checkout` → Checkout on Connect
- Metadata: `kind = maintenance_enrollment`
- **Needs:** `checkout.session.completed` (accept enrollment + first calendar booking)
- Pay-in-person path does not use Stripe
- Docs: `src/features/maintenance/docs/README.md`

### Create payment — Payment link (mobile)

- Create: `POST /api/payments/link` → Checkout `mode: payment` on Connect
- Metadata: `kind = walkup_payment_link`
- **Needs:** `checkout.session.completed` (paid / amount mismatch → failed)
- **Needs:** `checkout.session.expired` (open link past 24h)
- `/p/{code}` also re-checks Stripe on load if the webhook is late
- Docs: `src/features/payments/docs/WALKUP_PAYMENT_LINK.md`

### Create payment — Tap to Pay (mobile)

- Create: `POST /api/payments/tap-to-pay/intent` → PaymentIntent `card_present` on Connect
- Metadata: `kind = walkup_tap_to_pay`
- **Needs:** `payment_intent.succeeded` / `canceled` / `payment_failed`
- Mobile does **not** call a complete API; the webhook is the write path
- Docs: `src/features/payments/docs/WALKUP_TAP_TO_PAY.md`

### Booking Tap to Pay (job complete)

- PaymentIntent metadata: `kind = booking_tap_to_pay`
- **No webhook required.** `job_completed` retrieves the PI and verifies it (`verifyTapToPayPaymentIntent`)
- If Connect also receives `payment_intent.*` for these, the handler ignores them (wrong `metadata.kind`)

### Connect onboarding

- Return / refresh URLs call `accounts.retrieve` and update `payment_accounts`
- `account.updated` is **not handled** in the webhook today
- Optional to leave selected; not required for charges or memberships
- Docs: `src/features/payments/docs/CONNECT_ONBOARDING.md`

### Payments → Transactions

- Live Stripe list (`balanceTransactions.list` on the connected account)
- **No webhook required** for charges, refunds, or payouts

---

## Subscribed in production but unused

Safe to leave on. The handler returns 200 and does nothing.

| Event                                      | Notes                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `checkout.session.async_payment_succeeded` | For delayed methods (ACH, etc.). We do not fulfill on this event. Card Checkout does not need it |
| `checkout.session.async_payment_failed`    | Same. Unused                                                                                     |
| `account.updated`                          | Planned for `payment_accounts` drift; onboarding still uses return-URL sync                      |

---

## Do not add (not handled, not needed)

These showed up on the Connect destination during the weekly renewal and are easy to confuse with “we got the webhook.”

| Event / Dashboard label                 | Why we skip it                                                  |
| --------------------------------------- | --------------------------------------------------------------- |
| `invoice.upcoming` (“invoice incoming”) | Heads-up before the invoice exists. No membership side effects  |
| `balance.available`                     | Payout/funds availability. Transactions page reads balance live |
| `invoice.created` / `invoice.finalized` | We act on paid / payment_failed only                            |
| `invoice.payment_succeeded`             | Prefer `invoice.paid` (handles `$0` and paid invoices)          |
| `charge.succeeded`                      | Redundant with Checkout / PaymentIntent / invoice events        |
| `charge.refunded`                       | Transactions list is live Stripe                                |
| `payout.paid` / `payout.failed`         | Same                                                            |
| `customer.subscription.trial_will_end`  | Platform Pro leftover; memberships have no trial                |

---

## Platform destination (not Connect)

`/api/stripe/webhook` — **Your account** only. ServiceLink Pro for the business owner.

| Event                           | Required | Why                                    |
| ------------------------------- | -------- | -------------------------------------- |
| `checkout.session.completed`    | Yes      | First paid Pro                         |
| `customer.subscription.updated` | Yes      | Pro renewal / past_due / cancel-at-end |
| `customer.subscription.deleted` | Yes      | Pro ended → Free                       |
| `invoice.payment_failed`        | Yes      | Owner payment-failed email             |

Do **not** put membership / booking / payment-link events only on this destination. They fire on the connected account and will never arrive here.

Platform does **not** need `invoice.paid`.

---

## After changing the destination

1. Confirm the destination URL is `/api/stripe/webhook-connect` and scope is **Connected and v2 accounts**.
2. If you have more than one Connect destination (classic webhook + “PECs” / Event Destination), the one that actually POSTs to our app must have the **full required list**.
3. Replay missed events from Stripe → Developers → Events (kept ~30 days) so already-charged memberships get period + messages.
4. Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook-connect` with the same event types.
