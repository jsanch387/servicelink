# Contract addendum: Owner manual booking — auto-apply sale

Mobile create-appointment **previews** an active marketing **sale** on the Review step when the appointment date qualifies. Promo codes are **not** used on owner-created appointments.

Server applies (or re-validates) the sale when inserting the booking so amounts and discount snapshot columns stay correct.

**Parent contract:** [`mobile-owner-create-booking.md`](./mobile-owner-create-booking.md)  
**Marketing schema / rules:** `src/features/marketing/docs/` + [`mobile-marketing-promo-sales.md`](./mobile-marketing-promo-sales.md)

---

## Product rules (owner create)

| Rule                   | Detail                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Promo codes**        | Do **not** accept / apply on owner manual booking (`ownerManualBooking: true`). Ignored if sent.                                          |
| **Sales**              | If the business has an **`is_active = true`** sale that qualifies for `scheduledDate`, apply it automatically.                            |
| **Date window**        | Sale qualifies when `starts_at`/`ends_at` are null (no limit) **or** `scheduledDate` is within the sale window (inclusive calendar days). |
| **Stacking**           | Never stack. Owner flow = sale only (no promo).                                                                                           |
| **What is discounted** | Service + add-ons subtotal only (same as public book).                                                                                    |
| **Pro**                | Sale apply requires Pro owner (same gate as public).                                                                                      |

---

## What mobile may send (preview fields)

When a sale is previewed on Review, mobile may add these optional fields on `POST /api/public/bookings` (in addition to the existing owner body):

| Field            | Type                               | Notes                                                   |
| ---------------- | ---------------------------------- | ------------------------------------------------------- |
| `discountSource` | `"sale"`                           | Only when a sale applies                                |
| `discountSaleId` | uuid string                        | `sales.id`                                              |
| `discountType`   | `"percentage"` \| `"fixed_amount"` | Snapshot                                                |
| `discountValue`  | number                             | % or dollars (same semantics as `sales.discount_value`) |
| `subtotalCents`  | number                             | Service + add-ons **before** discount                   |
| `discountCents`  | number                             | Discount amount (≥ 0, ≤ subtotal)                       |
| `discountLabel`  | string                             | e.g. `25% OFF` or `$15 OFF` (UI label)                  |

**Important:**

- `servicePriceCents` and `selectedAddOns[].priceCents` remain **gross** (pre-discount). Do not treat them as already reduced.
- Mobile UI total = `subtotalCents - discountCents`.
- **Server ignores these preview fields** and recomputes from DB. Sending them is optional (helps debugging / future audit); correctness does not depend on them.

---

## What the server does

### 1. Resolve the sale (source of truth)

On `ownerManualBooking: true`:

1. Ignore `promoCode` and any client discount preview fields.
2. Load the active sale for the business (`is_active = true`, Pro owner).
3. Qualify against `scheduledDate` (open-ended null dates **or** within window).
4. Compute `discount_cents` from **gross** service + add-ons subtotal.

### 2. Persist booking discount snapshot

When a sale applies, set on `bookings`:

| Column                   | Value                          |
| ------------------------ | ------------------------------ |
| `discount_source`        | `'sale'`                       |
| `discount_sale_id`       | sale id                        |
| `discount_promo_code_id` | null                           |
| `discount_type`          | sale’s type                    |
| `discount_value`         | sale’s value                   |
| `subtotal_cents`         | service + add-ons pre-discount |
| `discount_cents`         | computed discount              |
| `discount_label`         | `{sale.name} — {amount} off`   |

When no sale applies: discount columns null / cleared per `bookingDiscountColumnsFromSnapshot(null)`.

### 3. Amount due / payments

Downstream amount-due math (complete visit, deposits, etc.) uses the snapshot (`discount_cents` / discounted service+addons basis), consistent with public booking.

`booking_payments` for the no-checkout owner path still records the **gross** total (same as public no-checkout create).

### 4. Do not write redemptions for sales

`promo_code_redemptions` is promo-only (on job complete). Sales do not insert redemptions.

---

## Example (sale applied)

```json
{
  "ownerManualBooking": true,
  "businessId": "…",
  "businessSlug": "acme-detail",
  "serviceName": "Full detail",
  "servicePriceCents": 20000,
  "selectedAddOns": [
    { "id": "…", "name": "Wax", "priceCents": 3500, "durationMinutes": 30 }
  ],
  "durationMinutes": 150,
  "scheduledDate": "2026-07-20",
  "startTime": "10:00",
  "paymentMethodSelected": "none",
  "serviceLocationType": "mobile",
  "discountSource": "sale",
  "discountSaleId": "sale-uuid",
  "discountType": "percentage",
  "discountValue": 20,
  "subtotalCents": 23500,
  "discountCents": 4700,
  "discountLabel": "20% OFF",
  "customer": {
    "fullName": "Jordan Lee",
    "email": "jordan@example.com",
    "phone": "5551234567",
    "streetAddress": "123 Main St",
    "unitApt": "",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "vehicleYear": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "notes": ""
  }
}
```

Server stores subtotal `23500`, discount `4700` (recomputed), label like `Summer Sale — 20% off`, and amount due based on net service+addons (`18800`) plus any non-discounted fees per existing rules.

---

## Implementation (web)

| Concern            | Location                                                         |
| ------------------ | ---------------------------------------------------------------- |
| Owner create route | `src/app/api/public/bookings/route.ts` (`allowPromoCode: false`) |
| Sale resolve       | `resolveBookingSaleDiscountSnapshot.ts`                          |
| Combined resolve   | `resolveBookingDiscountSnapshot.ts`                              |
| Persist columns    | `createBooking` → `bookingDiscountColumnsFromSnapshot`           |
| Amount due         | `computeBookingAmountDue.ts`                                     |

---

## Checklist

- [x] `POST /api/public/bookings` with `ownerManualBooking: true` resolves active sale from `scheduledDate`
- [x] Persists discount snapshot columns on `bookings`
- [x] Keeps `servicePriceCents` / add-on cents as gross; does not double-apply client discount
- [x] Rejects / ignores promo fields on owner manual path
- [x] Amount-due / complete-job paths honor sale snapshot (existing)
