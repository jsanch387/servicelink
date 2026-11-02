# Contract: Mobile — Payments transactions

Live feed of **money the owner collected**. The server paints the owner-facing row. Mobile does not reformat cents.

The **balance header** is Stripe-only (available / on the way). Cash / payment-app / other still appear as rows.

**Status:** Implemented in this repo.

**Stripe Connect:** needed for balance + card / Tap to Pay / payment-link / membership / payout rows. Offline collections still return when Connect is not set up (balance is `$0.00`).

**Pro:** required.

---

## Product summary

```text
Payments → Transactions
  header:  Available $1,247.50
           On the way $320.00
  rows:    Lights          +$38.54
           Jordan Lee · Tap to pay
           Signature Shine +1 more   +$189.00
           Jordan Lee · Card
           Payout          $120.00
           Arrived
```

Paint the strings we send.

| In this list                           | Not in this list                           |
| -------------------------------------- | ------------------------------------------ |
| Card / Tap to pay / payment link       | Unpaid appointments                        |
| Booking checkout (card)                | Booking Tap to Pay twice (Stripe row only) |
| Cash / payment app / other on complete | Mixed jobs / Double jobs as a title        |
| Membership / subscription charges      | Pricing tier in the title                  |
| Refunds                                | Card brand / last four                     |
| Payouts                                |                                            |

---

## Endpoint

| Method | Path                         | Purpose                 |
| ------ | ---------------------------- | ----------------------- |
| `GET`  | `/api/payments/transactions` | Balance + activity page |

**Example:** `http://localhost:3000/api/payments/transactions?limit=20`

**Central path:** `API_ROUTES.PAYMENTS_TRANSACTIONS`

---

## Headers

| Header          | Required | Value                            |
| --------------- | -------- | -------------------------------- |
| `Authorization` | yes      | `Bearer <Supabase access_token>` |
| `X-Request-ID`  | no       | Echoed on the response           |

---

## Query

| Param           | Required | Rules                                            |
| --------------- | -------- | ------------------------------------------------ |
| `limit`         | no       | `1`–`50`. Default **20**.                        |
| `startingAfter` | no       | Previous `nextCursor` (opaque; pass it through)  |
| `kind`          | no       | `payment` · `refund` · `payout` for a single tab |

`kind=refund` and `kind=payout` are Stripe-only. Offline collections are `payment`.

`nextCursor` is not always a `txn_…` id. Treat it as opaque.

---

## Success (HTTP 200)

```json
{
  "success": true,
  "currency": "usd",
  "balance": {
    "availableCents": 124750,
    "pendingCents": 32000,
    "currency": "usd",
    "availableLabel": "$1,247.50",
    "pendingLabel": "$320.00",
    "availableCaption": "Available",
    "pendingCaption": "On the way"
  },
  "items": [
    {
      "title": "Lights",
      "extraCount": 0,
      "subtitle": "Jordan Lee · Tap to pay",
      "methodLabel": "Tap to pay",
      "statusLabel": "Paid",
      "amountLabel": "+$38.54",
      "tone": "in",
      "dateLabel": "Aug 24"
    }
  ],
  "hasMore": true,
  "nextCursor": "2026-08-24T17:00:00.000Z|txn_…"
}
```

### What to paint

| UI           | Field                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| Header       | Available hero (`availableCaption` + `availableLabel`) + On the way row                 |
| Row title    | `title` — first service only. Smaller `+N more` from `extraCount` when `extraCount > 0` |
| Row subtitle | `subtitle` (`Customer · how they paid`)                                                 |
| Payout       | Title `Payout` + `statusLabel` (`Arrived`). Same two-line row. `subtitle` is empty      |
| Day label    | `dateLabel` (grouped; painted as-is)                                                    |
| Status       | `statusLabel` only when it is not `Paid`                                                |
| Amount       | `amountLabel` — color from `tone`                                                       |

### Row fields

| Field         | Rule                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `title`       | First **service name only**. No tier. Never `Mixed jobs` / `Double jobs`. Payouts: `Payout`. Walk-up notes stay the note. |
| `extraCount`  | Extra jobs after the first (`2` jobs → `1`). `0` when one job, walk-up, membership, or payout.                            |
| `subtitle`    | `Customer · how they paid`. No card digits. Payouts: `""`.                                                                |
| `methodLabel` | How they paid (`Tap to pay`, `Payment link`, `Cash`, `Card`). Not Visa / last four.                                       |
| `statusLabel` | `Paid` / `Arrived` / `Refunded` / `On the way` / `Pending`.                                                               |
| `bookingId`   | When the row is tied to a booking.                                                                                        |
| `serviceName` | Same as `title` for a job. `null` otherwise.                                                                              |
| `jobCount`    | `extraCount + 1` for a booking job. `0` for payout / walk-up without a booking.                                           |

### Examples

**One job**

```json
{
  "title": "Lights",
  "extraCount": 0,
  "subtitle": "Jordan Lee · Tap to pay",
  "methodLabel": "Tap to pay",
  "statusLabel": "Paid"
}
```

**Two jobs (never Double jobs)**

```json
{
  "title": "Signature Shine",
  "extraCount": 1,
  "subtitle": "Jordan Lee · Card",
  "methodLabel": "Card",
  "statusLabel": "Paid",
  "bookingId": "…"
}
```

Mobile paints: `Signature Shine` + smaller `+1 more`.

**Three+ jobs (never Mixed jobs)**

```json
{
  "title": "Interior",
  "extraCount": 2,
  "subtitle": "Pat · Payment link",
  "bookingId": "…"
}
```

**Payout**

```json
{
  "kind": "payout",
  "tone": "payout",
  "title": "Payout",
  "subtitle": "",
  "statusLabel": "Arrived",
  "extraCount": 0
}
```

Leave `amountLabel`, `tone`, `dateLabel`, `feeLabel`, and `nextCursor` as they are.

### `tone`

| `tone`   | `kind`         | Color        |
| -------- | -------------- | ------------ |
| `in`     | payment        | Green / plus |
| `out`    | refund         | Red / minus  |
| `payout` | payout to bank | Neutral      |

`source`: `tap_to_pay` · `payment_link` · `booking` · `membership` · `payout` · `cash` · `payment_app` · `other`

Do **not** send or expect `cardLast4`, `bankLast4`, or card digits in labels.

---

## Errors

`{ "success": false, "error": "…" }`

| Status  | Example `error`                                          |
| ------- | -------------------------------------------------------- |
| 401     | `Sign in again to view transactions.`                    |
| 403     | `Upgrade to Pro to view transactions.`                   |
| 400     | `kind must be payment, refund, or payout.`               |
| 404     | `Business profile not found`                             |
| 429     | `Too many requests. Please wait a moment and try again.` |
| 502/500 | `Couldn't load transactions. Try again.`                 |

Empty account: **200** with `items: []` and `$0.00` balance labels.

Connect not set up: **200** with offline rows (if any) and `$0.00` balance.

---

## What mobile must not do

- Call Stripe
- Send `businessId`
- Re-format `amountLabel`
- Parse `nextCursor` — send it back as `startingAfter`
- Expect `cardLast4`, `bankLast4`, or card digits in labels
- Paint `Mixed jobs` / `Double jobs` — the server will not send those titles

---

## Verification

```bash
curl -sS "$ORIGIN/api/payments/transactions?limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Request-ID: $(uuidgen)"
```

Expect **200** with `title` (first service or `Payout`), `extraCount`, `subtitle`, `statusLabel`, and `nextCursor` when `hasMore` is true.

Page 2: pass the previous `nextCursor` as `startingAfter`. Do not parse it.
