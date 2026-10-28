# Sales tax

How ServiceLink adds sales tax on customer charges. This is shop sales tax. It is separate from the tax Stripe may add on a ServiceLink Pro or Team subscription.

## Rules

The business turns tax on and sets a percentage. There is no flat dollar amount, and customer charges do not use Stripe Tax.

- The rate lives on `payment_settings`: `tax_enabled` and `tax_rate_bps`.
- `825` basis points is 8.25%. The cap is 25% (`2500`). The field keeps two decimal places.
- Zero is not a valid rate while the switch is on. Turning the switch off keeps the stored rate and stops adding tax.
- Tax is added once, on the price after discounts. `salesTaxCents = round(taxableCents * bps / 10000)`.
- An $85 job at 2.25% (`225` bps) is $1.91 tax. The customer pays $86.91.
- Listed prices stay pre-tax. `price_cents` and line prices do not include tax. The customer pays price + tax.
- The server recomputes tax from the shop rate or from the tax already frozen on that record. The client does not send the tax amount.
- Session fees are not taxed again.
- The connected account is the merchant (direct charges). Tax is part of the charge and pays out with the rest of the money. ServiceLink does not file the return or hold the tax. The business remits it.

Stripe Tax (`automatic_tax`) is only on ServiceLink’s own Pro and Team checkout in `src/app/api/stripe/create-checkout-session/route.ts`.

Settings UI: `PaymentsTaxSettingsCard`. Math: `src/features/payments/utils/salesTaxRate.ts`. The shared quote used by bookings, quotes, invoices, and memberships is `quotePublicBookingSalesTax`.

## Where a charge freezes the tax

| Record | Columns | What the customer pays |
| --- | --- | --- |
| `payment_settings` | `tax_enabled`, `tax_rate_bps` | The live shop rate. Not a charge. |
| `booking_payments` | `tax_rate_bps`, `tax_cents` | `total_amount_cents` includes tax. |
| `quotes` | `tax_rate_bps`, `tax_cents` | `price_cents + tax_cents`. |
| `invoices` | `tax_rate_bps`, `tax_cents` | `subtotal_cents + tax_cents`. |
| `membership_plan_prices` | `tax_rate_bps`, `tax_cents` | Stripe `unit_amount` is `price_cents + tax_cents`. |

A saved quote, invoice, or booking keeps the tax from when it was saved. Changing the shop rate later does not rewrite those rows. Editing and saving a quote again recomputes from the current shop rate.

## Bookings

Public checkout (`POST /api/public/booking-checkout`) loads the shop rate, taxes the price after discounts, and rejects the session when the card amount does not match that result.

Tax is calculated once on the full job. A deposit, fixed or percent, is then a slice of that taxed total. Pay in full charges the taxed total. The deposit and the remaining balance add up to the same total.

The owner create-appointment wizard uses the same formula. A custom job is taxed on the price the owner types. A membership visit stays $0 and is not taxed.

Confirmation and job emails include a tax line only when `tax_cents` is greater than 0.

Tap to pay on an existing job reads `booking_payments.tax_cents` and charges the amount still due on that taxed job. It does not look up the shop rate again.

## Quotes

Creating or updating a quote stores `price_cents` before tax and writes `tax_rate_bps` and `tax_cents` from the current shop rate. The quote screen, the public quote, and the quote email show the tax row and the total when tax is greater than 0.

Approving a quote copies that frozen tax onto the booking. The booking does not recalculate from a newer shop rate.

## Invoices

A bill created from a booking keeps that booking’s tax, including a booking that had no tax. A standalone invoice uses the shop’s current settings.

Line amounts stay pre-tax. `total_cents` is `subtotal_cents + tax_cents`. The on-screen bill, the PDF, and the invoice email show the tax row when tax is greater than 0.

## Memberships

The plan price the owner types stays pre-tax. Tax is stored on each `membership_plan_prices` row and baked into the Stripe Price: `unit_amount = price_cents + tax_cents`. There is no second Stripe Price for tax.

- The public booking-link card shows the pre-tax price only. Tax is shown on the review step, then charged at checkout.
- Owner plan cards and the create and edit screens show the tax caption.
- Checkout calls `ensureMembershipPriceIncludesShopTax` before creating the session, so a new signup uses the current shop rate.
- Saving a plan creates a new Stripe Price when the pre-tax amount, the interval, or the tax changes, and archives the old Price. People who already subscribed keep the Price they signed up on. They are not migrated.
- The membership invoice email shows a tax row only when the charged amount is `price_cents + tax_cents` and tax is greater than 0.
- A membership visit booked against an active plan is $0 and is not taxed.

Migration: `src/features/subscriptions/docs/migrations/014_membership_plan_prices_sales_tax.sql`.

## Earnings

Sales tax collected is not earnings. On Payments, the big number and the chart are the job price after discounts and fees. “Tax collected” is a separate line, and it appears only when finished jobs in that range have `tax_cents` greater than 0.

The same pre-tax number feeds the home dashboard chart. That chart does not show a tax line.

Completed jobs are the only ones counted. The payout from Stripe still includes the tax, because the tax was part of the charge.

## Still open

Create payment → Payment link and Create payment → Tap to pay charge the typed amount with no tax. Those wait until the mobile app sends tax with the amount. They write `payment_requests`, not `booking_payments`.

## Code map

| Piece | File |
| --- | --- |
| Rate field, cap, and cent rounding | `src/features/payments/utils/salesTaxRate.ts` |
| Shared tax quote, deposit slice, email line | `src/features/availability/booking/utils/publicBookingSalesTax.ts` |
| Quote wrapper | `src/features/quotes/shared/quoteSalesTax.ts` |
| Invoice wrapper | `src/features/invoices/utils/invoiceSalesTax.ts` |
| Membership tax and Stripe unit amount | `src/features/subscriptions/server/membershipSalesTax.ts` |
| Earnings minus tax | `src/features/payments/revenue/computeBookingEarningsCents.ts` |
