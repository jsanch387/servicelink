# Contract: Mobile — Owner creates availability booking (manual)

Use this when the **signed-in business owner** books an appointment **on behalf of a customer** from the native app. The server runs the **same** handler as the web dashboard flow (`/[slug]/book?for=owner`): it inserts the booking, payment summary row, owner notification + Expo push, and (when present) **sends the customer confirmation email**.

**Do not** insert rows directly into Supabase from the app for this flow — you would skip email, `booking_payments`, free-tier enforcement, time-off checks, and owner notifications.

**Implementation:** `POST /api/public/bookings` in `src/app/api/public/bookings/route.ts`  
**Request type (reference):** `CreateBookingRequest` in `src/features/availability/booking/types.ts`  
**Customer validation:** `bookingCustomerPayloadErrorMessage` / `normalizeBookingCustomerInput` in `src/features/availability/booking/utils/bookingCustomerFieldLimits.ts`

---

## Endpoint

|                     |                                           |
| ------------------- | ----------------------------------------- |
| **Method**          | `POST`                                    |
| **Path**            | `/api/public/bookings`                    |
| **Example (local)** | `https://<your-host>/api/public/bookings` |

Use your production API origin in release builds.

---

## Authentication (required for owner flow)

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |

The access token is the same JWT the Expo app already uses for other authenticated API routes (e.g. Stripe, dashboard).

**Behavior:** When `ownerManualBooking` is `true`, the server resolves the user with `getAuthenticatedUser` (Bearer **or** cookies). The authenticated user must own **`businessId`** (via `business_profiles.profile_id = auth.uid()`). Mismatch → **403 Forbidden**.

---

## Request body (JSON)

Set **`ownerManualBooking`** to **`true`** so the route treats this as an owner booking and requires auth.

### Top-level fields

| Field                     | Type    | Required | Notes                                                                                                                                                 |
| ------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `businessSlug`            | string  | Yes      | Must match the business’s public slug (used with `businessId` for consistency checks).                                                                |
| `businessId`              | string  | Yes      | UUID of `business_profiles.id` for this business. Must equal the slug’s business **and** the authenticated owner’s business.                          |
| `serviceName`             | string  | Yes      | Base service name.                                                                                                                                    |
| `serviceId`               | string  | No       | Optional service id if you have it.                                                                                                                   |
| `servicePriceOptionLabel` | string  | No       | If the owner picked a multi-price option, send the label; server stores `"{serviceName} — {label}"`.                                                  |
| `servicePriceCents`       | number  | No       | Omit or `0` when free; used for totals / email / `booking_payments`.                                                                                  |
| `selectedAddOns`          | array   | No       | Each item: `{ "id", "name", "priceCents", "durationMinutes"? }`.                                                                                      |
| `durationMinutes`         | number  | Yes      | Total appointment length (service + add-on time as computed in UI). Integer ≥ 1.                                                                      |
| `scheduledDate`           | string  | Yes      | `YYYY-MM-DD`.                                                                                                                                         |
| `startTime`               | string  | Yes      | `H:mm` or `HH:mm` (24h), e.g. `9:30` or `09:30`.                                                                                                      |
| `customer`                | object  | Yes      | See **Customer object** below.                                                                                                                        |
| `paymentMethodSelected`   | string  | No       | Owner web flow does **not** collect card on this POST; send **`"none"`** (same as dashboard owner confirm). Omit is also treated as unset downstream. |
| `ownerManualBooking`      | boolean | Yes      | Must be **`true`** for this contract.                                                                                                                 |

### Customer object (`customer`)

All keys are **strings** in JSON (server coerces missing keys to empty string, then validates).

| Field                                        | Required    | Notes                                                                                                              |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `fullName`                                   | Yes         | Non-empty after trim; max 120 chars.                                                                               |
| `email`                                      | No          | If empty, no customer confirmation email is sent. If non-empty, must be valid format; max 254 chars.               |
| `phone`                                      | Yes         | Non-empty after trim.                                                                                              |
| `streetAddress`                              | Yes         | Non-empty; max 200 chars.                                                                                          |
| `unitApt`                                    | No          | Max 50 chars.                                                                                                      |
| `city`                                       | Yes         | Max 100 chars.                                                                                                     |
| `state`                                      | Yes         | Stored uppercased, 2-letter region code.                                                                           |
| `zip`                                        | Yes         | US: **5** digits or **9** digits (ZIP+4, no hyphen).                                                               |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | Conditional | If **any** of the three is non-empty, **all three** are required; year must be 4 digits (1900 … current year + 1). |
| `notes`                                      | No          | Max length matches `CUSTOMER_NOTE_MAX_LENGTH` (see `bookingCustomerFieldLimits.ts`).                               |

### Example (minimal owner booking)

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "serviceName": "Full detail",
  "servicePriceCents": 15000,
  "durationMinutes": 120,
  "scheduledDate": "2026-05-20",
  "startTime": "10:00",
  "paymentMethodSelected": "none",
  "ownerManualBooking": true,
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

---

## Success response

**HTTP:** `201 Created`

Response headers include **`X-Request-ID`** (echo / trace id for support).

```json
{
  "success": true,
  "data": {
    "id": "<new booking uuid>"
  }
}
```

**Server side effects (best-effort where noted):**

1. **`bookings`** row created (status per `createBooking` in `bookingService`).
2. **`booking_payments`** row for no-checkout path (`insertBookingPaymentsRowForNoCheckoutPublicBooking`) using business `payment_settings`.
3. **Owner:** in-app `notifications` + Expo push (`notifyOwnerForAvailabilityBookingCreated`) when `profile_id` exists.
4. **Customer:** `sendAvailabilityBookingCustomerConfirmationEmail` **only if** `customer.email` is non-empty after normalization.

---

## Error responses

Body shape is generally:

```json
{
  "success": false,
  "error": "<English message suitable for display or logging>"
}
```

| HTTP  | Typical `error` / cause                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `400` | Missing/invalid fields (date, time, duration, customer validation, `businessId` / slug mismatch).                                |
| `401` | Missing/invalid Bearer token or no session (owner mode).                                                                         |
| `403` | Authenticated user is not the owner of `businessId`, or free-tier booking cap reached (`enforceFreeTierBookingCapBeforeCreate`). |
| `404` | Unknown slug or business not publicly visible.                                                                                   |
| `409` | Slot overlaps owner **time off** for that business.                                                                              |
| `500` | Unexpected failure (e.g. `booking_payments` insert failed — booking may be rolled back).                                         |

---

## Public (customer) self-serve vs owner

The **same** path `POST /api/public/bookings` supports **unauthenticated** customers when **`ownerManualBooking` is omitted or false**. That flow is **not** described here. Mobile **owner** booking must always send **`ownerManualBooking: true`** and **Bearer** auth.

---

## Stripe / card checkout

Owner manual booking in the **web** app does not open Stripe Checkout on confirm; it uses the no-checkout POST with `paymentMethodSelected: "none"`. If you later add **customer-paid** booking from mobile, that will be a **different** contract (e.g. public booking checkout session + webhook) — not covered by this document.

---

## Related code

| Piece                     | Location                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Route handler             | `src/app/api/public/bookings/route.ts`                                             |
| Auth helper               | `src/libs/api/getAuthenticatedUser.ts`                                             |
| Owner business resolution | `src/server/resolveCurrentBusinessId.ts`                                           |
| Customer email            | `sendAvailabilityBookingCustomerConfirmationEmail` (availability booking template) |
