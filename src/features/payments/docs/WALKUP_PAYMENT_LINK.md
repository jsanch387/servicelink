# Create payment link (v1)

Owner-created one-time charge. Not a booking. Product name is **Create payment → Payment link**. Code still lives under `src/features/payments/walk-up/`.

Mobile: Home FAB → Create payment → Payment link.  
Contract: [`docs/contracts/mobile-create-payment-link.md`](../../../../docs/contracts/mobile-create-payment-link.md)  
Table: [`PAYMENT_REQUESTS_TABLE.md`](./PAYMENT_REQUESTS_TABLE.md)

## Sequence

```text
Owner (mobile)
  → POST /api/payments/link  { amountCents, currency?, note }
       → insert payment_requests (status open, collection_method checkout_link)
       → stripe.checkout.sessions.create on connected account
            metadata.kind = walkup_payment_link
       → store stripe_checkout_session_id + stripe_checkout_url + short_code
       → return { success, url: https://…/p/{short_code}, paymentLinkId }
  → Share / Copy url  (never the raw checkout.stripe.com URL)

Customer (browser)
  → /p/{short_code} receipt
  → Pay → Stripe Checkout
  → success_url = /pay/complete?status=success
  → cancel_url = /p/{short_code}  (same receipt as first open)

Stripe → POST /api/stripe/webhook-connect
  → checkout.session.completed
       → applyWalkUpPaymentCheckoutCompleted → status = paid
  → checkout.session.expired
       → applyWalkUpPaymentCheckoutExpired → status = expired
            (`/p/…` also expires the row if Stripe already says expired)
```

## Gates

- Authenticated owner (Bearer or cookie)
- `payment_accounts`: onboarding `complete`, `charges_enabled`, `stripe_account_id`
- Direct charges on the connected account
- Amount `50`–`999999` cents, currency `usd`, required note
- Rate limit: 10/min and 40/hour per owner (also IP caps)

Does **not** require `payment_settings.payments_enabled` (that flag is booking checkout only).

## RLS (`payment_requests`)

Set in `sql/001_payment_requests.sql`. `002` only adds columns — no new policies.

| Role            | Access                                           |
| --------------- | ------------------------------------------------ |
| `authenticated` | **SELECT** rows for the owner’s business         |
| `anon`          | none                                             |
| `service_role`  | ALL (create API + webhook + public page loader)  |

No client insert/update. Public `/p/…` reads through the admin client and only renders amount, note, business name, and the Checkout URL.

## Customer pages

| Status / event        | UI                                                                 |
| --------------------- | ------------------------------------------------------------------ |
| `open`                | Light receipt card on dark chrome; Pay → Stripe                    |
| Cancel from Stripe    | Back to the same receipt                                           |
| Success               | `/pay/complete?status=success` — checkmark, “Payment successful”   |
| `paid`                | Centered “Already paid” + success checkmark                        |
| `expired`             | “This link expired” — ask the business for a new one               |
| `canceled` / `failed` | “Link unavailable”                                                 |

Share unfurl is generic: **Payment Link** / **Secure checkout** / `$` icon (not ServiceLink, not the amount).

## Stripe Dashboard

Connect webhook (`/api/stripe/webhook-connect`) must include:

- `checkout.session.completed`
- `checkout.session.expired`

## Not in this pass

Create-payment Tap to Pay, deposit-on-booking links, CRM customer, SMS of the URL, in-app paid list, owner revoke.
