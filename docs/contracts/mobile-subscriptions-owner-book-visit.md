# Contract: Mobile — Owner books a membership period visit

How web attaches an owner-created appointment to a subscriber’s **current Stripe billing period** so subscriber detail shows **scheduled** / **Visit complete** instead of **Needs visit**.

**Status display:** [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md)  
**Base create API:** [`mobile-owner-create-booking-multi-job.md`](./mobile-owner-create-booking-multi-job.md) (preferred) / [`mobile-owner-create-booking.md`](./mobile-owner-create-booking.md)

**Web:** Subscriber detail **Book visit** → `/dashboard/bookings/new?membershipId=…` → `POST /api/public/bookings` with `membershipId`.  
**Server link helper:** `linkMembershipPeriodVisit` in `src/features/subscriptions/server/linkMembershipPeriodVisit.ts` (called **inside** the create route — not a second mobile call).

---

## Short answers

| Question                                   | Answer                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does create-booking accept `membershipId`? | **Yes** — on `POST /api/public/bookings` with `ownerManualBooking: true`.                                                                                                                   |
| Separate link API after create?            | **No.** Same request: after the booking (+ `booking_payments`) succeeds, the server calls `linkMembershipPeriodVisit`.                                                                      |
| How does it show as a membership visit?    | Send `paymentMethodSelected: "membership"` (web also sets this when `membershipId` is present). Payments row becomes `payment_method_selected: membership`, `payment_status: not_required`. |
| Which create shape?                        | Prefer **`jobs[]`** (multi-job body). **Period linking currently runs only on the `jobs[]` path** — not the legacy single-job body.                                                         |

---

## Endpoint (same as owner create)

|              |                                                 |
| ------------ | ----------------------------------------------- |
| **Method**   | `POST`                                          |
| **Path**     | `/api/public/bookings`                          |
| **Auth**     | `Authorization: Bearer <Supabase access_token>` |
| **Required** | `ownerManualBooking: true`                      |

---

## Body extras for a period visit

On top of a normal owner multi-job create body:

| Field                   | Value                            | Notes                                                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `membershipId`          | `customer_memberships.id` (UUID) | Subscriber id from detail / list                                         |
| `paymentMethodSelected` | `"membership"`                   | Web always sends this when `membershipId` is set                         |
| `applySale`             | `false`                          | Web disables sale on membership visits                                   |
| `jobs[]`                | **Required for linking**         | At least one job; use plan visit as a custom / $0 line if you mirror web |

Web builder (`buildOwnerCreateAppointmentBody`):

```ts
paymentMethodSelected: membershipId ? 'membership' : 'none',
ownerManualBooking: true,
applySale: membershipId ? false : visit.applySale,
...(membershipId ? { membershipId } : {}),
// + jobs[], customer, scheduledDate, startTime, location…
```

### Example (minimal shape)

```json
{
  "businessId": "<uuid>",
  "businessSlug": "acme-detail",
  "ownerManualBooking": true,
  "membershipId": "<customer_memberships.id>",
  "paymentMethodSelected": "membership",
  "applySale": false,
  "scheduledDate": "2026-08-20",
  "startTime": "09:00",
  "serviceLocationType": "mobile",
  "customerServiceLocation": "mobile",
  "customer": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "5551234567",
    "streetAddress": "123 Main St",
    "unitApt": "",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "vehicleYear": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "notes": "Gate code 1234"
  },
  "jobs": [
    {
      "serviceName": "Essential Wash",
      "servicePriceCents": 0,
      "durationMinutes": 60,
      "vehicle": { "year": "2020", "make": "Toyota", "model": "Camry" }
    }
  ]
}
```

Prefill on web comes from query params (`membershipId`, `name`, `email`, `phone`, `notes`, `planName`, `durationMinutes`) via `getOwnerCreateAppointmentPath` — mobile can pass the same fields from the subscriber object without hitting a special prefill API.

---

## What the server does after create (you do not call this)

When `ownerManualBooking && membershipId` and the booking was created via **`jobs[]`**:

1. Insert booking as usual.
2. Insert `booking_payments` with:
   - `payment_method_selected: 'membership'`
   - `payment_status: 'not_required'` (membership is never `awaiting_payment`)
   - `provider: 'none'`
   - totals from the jobs (often `$0` / `0` cents — fine)
3. **`linkMembershipPeriodVisit`**:
   - Loads membership for `businessId` + `membershipId`
   - Requires `current_period_start`
   - Sets:
     - `period_visit_booking_id` = new booking id
     - `period_visit_period_start` = that `current_period_start`
     - optionally backfills `customer_id` from the booking customer

There is **no** public `POST …/link-period-visit` for mobile. Do not write `period_visit_*` from the app (RLS / service-role; owner is SELECT-only on `customer_memberships`).

If link fails, the booking still exists; the server logs a warning. Visit status may stay **Needs visit** until linked — treat as a soft failure / support case (same as web).

---

## Payment / UI semantics

| Field                                      | Membership visit                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `booking_payments.payment_method_selected` | `membership`                                                                |
| `booking_payments.payment_status`          | `not_required`                                                              |
| Job price                                  | Often `0`; covered by plan — UI shows **Membership**, not Collect in person |
| Sale / promo                               | Off (`applySale: false`)                                                    |

Sending only `$0` **without** `paymentMethodSelected: "membership"` / `membershipId` can look like “No charge” / collect-in-person — not a membership visit.

---

## Success response

Same as owner create (`201`):

```json
{
  "success": true,
  "data": {
    "id": "<bookingId>",
    "visitId": "<bookingId>",
    "jobCount": 1
  }
}
```

Then refetch subscriber (or recompute `visitStatus`): with `period_visit_*` set and booking not completed → **`scheduled`**.

---

## Checklist for mobile

- [ ] Navigate Book visit → owner create flow with subscriber prefill
- [ ] Submit **`jobs[]`** body + `ownerManualBooking: true` + `membershipId` + `paymentMethodSelected: "membership"`
- [ ] Do **not** call a separate link endpoint
- [ ] Do **not** use legacy single-job body if you need period linking today
- [ ] After success, refresh subscriber detail visit section

---

## Web references

| Piece           | Location                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| Book visit href | `getOwnerCreateAppointmentPath` in `src/constants/routes.ts`               |
| Create body     | `buildOwnerCreateAppointmentBody`                                          |
| Create + link   | `POST` handler in `src/app/api/public/bookings/route.ts` (`jobs[]` branch) |
| Link update     | `linkMembershipPeriodVisit.ts`                                             |
