# Contract: Mobile — Owner creates availability booking (manual)

Use this when the **signed-in business owner** books an appointment **on behalf of a customer** from the native app. Mobile must mirror the web owner flow: choose a **catalog service** or **custom job**, schedule it, collect customer/optional vehicle/location/notes details, review, and submit. The server inserts the booking and payment summary row, records the source as owner-created, sends owner notifications, and (when present) sends the customer confirmation email.

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

## Required mobile flow

The mobile UI should offer the same two entry choices as web:

1. **From services**
   - Load/select a catalog service.
   - Select a pricing option when the service has options.
   - Select zero or more add-ons.
   - Send the selected service/add-on snapshot described below.
2. **Custom job**
   - Collect a custom job name, price, duration, and optional appointment notes.
   - Omit `serviceId`, `servicePriceOptionLabel`, and normally `selectedAddOns`.

Both choices then continue through schedule, customer details, service location, optional vehicle/notes, review, and the same submit endpoint.

The client does **not** send `bookingSource`. The server derives and stores:

```text
bookings.booking_source = 'owner'
```

only after `ownerManualBooking: true` passes owner authentication. This prevents source spoofing.

---

## Request body (JSON)

Set **`ownerManualBooking`** to **`true`** so the route treats this as an owner booking and requires auth.

### Top-level fields

| Field                     | Type    | Required | Notes                                                                                                                                                 |
| ------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `businessSlug`            | string  | Yes      | Must match the business’s public slug (used with `businessId` for consistency checks).                                                                |
| `businessId`              | string  | Yes      | UUID of `business_profiles.id` for this business. Must equal the slug’s business **and** the authenticated owner’s business.                          |
| `serviceName`             | string  | Yes      | Catalog service name or owner-entered custom job name.                                                                                                |
| `serviceId`               | string  | Catalog  | Send for a catalog service. **Omit for a custom job.**                                                                                                |
| `servicePriceOptionLabel` | string  | No       | Selected catalog pricing-option label. Omit for custom jobs. Server stores `"{serviceName} — {label}"` as the booking service snapshot.               |
| `servicePriceCents`       | number  | Yes      | Base/selected-option price for catalog services, or owner-entered custom-job price. Send integer cents; `0` is valid.                                 |
| `selectedAddOns`          | array   | No       | Selected catalog add-on snapshots. Omit or send `[]` when none; normally omit for custom jobs. See the exact item shape below.                        |
| `durationMinutes`         | number  | Yes      | **Total** appointment length: service/custom duration plus all selected add-on durations. Send a positive integer.                                    |
| `scheduledDate`           | string  | Yes      | `YYYY-MM-DD`.                                                                                                                                         |
| `startTime`               | string  | Yes      | `H:mm` or `HH:mm` (24h), e.g. `9:30` or `09:30`.                                                                                                      |
| `customer`                | object  | Yes      | See **Customer object** below.                                                                                                                        |
| `paymentMethodSelected`   | string  | No       | Owner web flow does **not** collect card on this POST; send **`"none"`** (same as dashboard owner confirm). Omit is also treated as unset downstream. |
| `ownerManualBooking`      | boolean | Yes      | Must be **`true`** for this contract.                                                                                                                 |
| `serviceLocationType`     | string  | Yes\*    | **`"mobile"`** or **`"shop"`**. Required when the business supports both; recommended always. Single-mode businesses can be inferred server-side.     |
| `customerServiceLocation` | string  | No       | Web alias for the same choice. Mobile should send **`serviceLocationType`** instead. If both are sent, **`serviceLocationType` wins**.                |
| `promoCode`               | string  | No       | **Ignored** on owner manual booking. Promo codes are public-checkout only.                                                                            |
| `discountSource` …        | mixed   | No       | Optional **Review preview** fields (`discountSaleId`, `discountCents`, etc.). **Ignored** — server recomputes the sale snapshot. See sale addendum.   |

\*Mobile should always send `serviceLocationType`. If omitted, the server infers `mobile` for `mobile_only` and `shop` for `shop_only`; a `both` business receives `400`.

**Sale auto-apply:** see [`mobile-owner-create-booking-sale.md`](./mobile-owner-create-booking-sale.md).

### Canonical mobile request types

```ts
type OwnerCreateBookingRequest = {
  businessSlug: string;
  businessId: string;
  serviceName: string;
  serviceId?: string;
  servicePriceOptionLabel?: string;
  servicePriceCents: number;
  selectedAddOns?: Array<{
    id: string;
    name: string;
    priceCents: number;
    durationMinutes?: number | null;
  }>;
  durationMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // H:mm or HH:mm, 24-hour
  customer: {
    fullName: string;
    email: string;
    phone: string;
    streetAddress: string;
    unitApt: string;
    city: string;
    state: string;
    zip: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
    notes: string;
  };
  paymentMethodSelected?: 'none' | 'pay_in_person';
  ownerManualBooking: true;
  serviceLocationType: 'mobile' | 'shop';
};

type OwnerCreateBookingResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: string; errorCode?: string };
```

Do not include `bookingSource` or `booking_source` in the request.

### `serviceLocationType` rules

| Value      | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"mobile"` | Owner travels to the customer. `customer.*` address = service address.  |
| `"shop"`   | Customer visits the shop. `customer.*` address = business shop address. |

**Validation (server):**

- Must be `"mobile"` or `"shop"` when sent.
- `"shop"` rejected if `business_profiles.service_location_mode` is `mobile_only`.
- `"mobile"` rejected if `business_profiles.service_location_mode` is `shop_only`.
- For `both`, either value is allowed.

**Persistence:** stored on **`bookings.service_location_type`**. This route resolves a concrete `mobile` or `shop` value before insert.

**Shop address:** when `"shop"`, customer address fields may be empty. The server validates that the business has a complete shop address and copies the profile’s shop address into the booking snapshot.

### Service and add-on snapshots

`selectedAddOns` items have this exact shape:

```ts
type AddOnAtBooking = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
};
```

- `servicePriceCents` and add-on prices are integer cents and are **gross/pre-discount**.
- `durationMinutes` at the top level must already include add-on time.
- The server stores `selectedAddOns` in `bookings.addon_details` and uses the snapshot in the dashboard and emails.
- The current endpoint trusts submitted catalog names, IDs, prices, and duration snapshots; mobile should derive them from the catalog response and must not recalculate names or prices independently.
- There is currently no `servicePriceOptionId` field in this booking contract. Send the selected option’s label and price.

All keys are **strings** in JSON (server coerces missing keys to empty string, then validates).

| Field                                        | Required    | Notes                                                                                                              |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `fullName`                                   | Yes         | Non-empty after trim; max 120 chars.                                                                               |
| `email`                                      | No          | If empty, no customer confirmation email is sent. If non-empty, must be valid format; max 254 chars.               |
| `phone`                                      | Yes         | Non-empty after trim.                                                                                              |
| `streetAddress`                              | Conditional | Required for `"mobile"`; ignored/prefilled from the business for `"shop"`. Max 200 chars.                          |
| `unitApt`                                    | No          | Max 50 chars when the customer address is used.                                                                    |
| `city`                                       | Conditional | Required for `"mobile"`; max 100 chars.                                                                            |
| `state`                                      | Conditional | Required for `"mobile"`; normalized uppercase and truncated to two characters.                                     |
| `zip`                                        | Conditional | Required for `"mobile"`; exactly **5 US digits**.                                                                  |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | Conditional | If **any** of the three is non-empty, **all three** are required; year must be 4 digits (1900 … current year + 1). |
| `notes`                                      | No          | Owner-entered appointment/custom-job notes; max 280 characters. Stored in `bookings.customer_notes`.               |

Email and vehicle behavior:

- `customer.email` is optional. When empty, no customer email is attempted and the email row is omitted from the owner notification.
- Vehicle is optional. Send all three vehicle fields or send all three as empty strings; partial vehicle data returns `400`.
- The shared column is named `customer_notes`, but in this owner contract the text is authored by the owner. Emails label it neutrally as **Notes**.

### Example: catalog service with pricing option and add-ons

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "serviceId": "uuid-of-business_services-row",
  "serviceName": "Full detail",
  "servicePriceOptionLabel": "SUV",
  "servicePriceCents": 17500,
  "selectedAddOns": [
    {
      "id": "uuid-of-addon",
      "name": "Pet hair removal",
      "priceCents": 5000,
      "durationMinutes": 30
    }
  ],
  "durationMinutes": 150,
  "scheduledDate": "2026-05-20",
  "startTime": "10:00",
  "paymentMethodSelected": "none",
  "ownerManualBooking": true,
  "serviceLocationType": "mobile",
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
    "notes": "Please use the side gate."
  }
}
```

The server stores:

- `service_id` as the submitted catalog service ID.
- `service_name` as `Full detail — SUV`.
- `service_price_cents` as `17500`.
- The add-on array in `addon_details`.
- `duration_minutes` as `150`.
- `booking_source` as `owner`.

### Example: custom job with optional vehicle and no customer email

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "serviceName": "Headlight restoration",
  "servicePriceCents": 12500,
  "durationMinutes": 90,
  "scheduledDate": "2026-05-21",
  "startTime": "13:30",
  "paymentMethodSelected": "none",
  "ownerManualBooking": true,
  "serviceLocationType": "shop",
  "customer": {
    "fullName": "Taylor Smith",
    "email": "",
    "phone": "5559876543",
    "streetAddress": "",
    "unitApt": "",
    "city": "",
    "state": "",
    "zip": "",
    "vehicleYear": "2022",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "notes": "Restore both headlights and inspect the passenger-side housing."
  }
}
```

For a custom job:

- Do **not** send `serviceId`.
- Do **not** send `servicePriceOptionLabel`.
- Omit `selectedAddOns` unless custom add-ons become an explicit product feature.
- The server stores `service_id = NULL`; the submitted name, price, duration, and notes remain the booking snapshot.
- The empty email means no customer confirmation email is sent.

---

## Success response

**HTTP:** `201 Created`

Response headers include:

- `X-Request-ID` — server-generated or accepted from `X-Request-ID` / `X-Correlation-ID` (truncated to 128 characters).
- `Cache-Control: no-store`.

```json
{
  "success": true,
  "data": {
    "id": "<new booking uuid>"
  }
}
```

**Server side effects (best-effort where noted):**

1. **`bookings`** row created with status `confirmed`, `booking_source = 'owner'`, service/custom-job snapshot, add-ons, customer/contact/address/vehicle/notes snapshot, resolved `service_location_type`, and sale snapshot columns when applicable.
2. **`booking_payments`** row for no-checkout path (`insertBookingPaymentsRowForNoCheckoutPublicBooking`) using business `payment_settings` (gross total).
3. **Owner:** in-app notification, Expo push, and owner email when `profile_id` / owner email are available. Owner-created copy says **Appointment created** / **For {customer}**.
4. **Customer:** confirmation email only if `customer.email` is non-empty after normalization.
5. **Email content:** service/custom-job name, option label, add-ons, prices/totals/discount/payment summary, schedule, location, contact details, optional vehicle, and notes. Empty optional fields/sections are omitted.

Email and push delivery are best-effort and do not change the successful `201` response.

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
| `400` | Missing/invalid fields (date, time, duration, customer validation, `businessId` / slug mismatch, invalid `serviceLocationType`). |
| `401` | Missing/invalid Bearer token or no session (owner mode).                                                                         |
| `403` | Authenticated user is not the owner of `businessId`, or free-tier booking cap reached (`enforceFreeTierBookingCapBeforeCreate`). |
| `404` | Unknown slug or business not publicly visible.                                                                                   |
| `409` | Slot overlaps owner **time off** for that business.                                                                              |
| `500` | Unexpected failure (e.g. `booking_payments` insert failed — booking may be rolled back).                                         |

### Scheduling and retry behavior

- The POST rejects overlap with configured owner **time off**.
- The mobile availability UI should use the existing blocked-slots/availability data before submit.
- The POST currently does **not** re-check overlap against other bookings. Mobile must refresh availability before final confirmation, but this is not a transactional guarantee against simultaneous submissions.
- There is currently no idempotency key. Disable the submit button while the request is running and do not automatically retry a request after an ambiguous timeout; first refresh bookings to avoid duplicates.
- Date/time validation currently checks request shape (`YYYY-MM-DD`, `H:mm`/`HH:mm`) and the database performs final date/time validation.
- Free-tier owners are subject to the current lifetime booking cap. An owner-created mobile appointment counts toward that cap.

---

## Public (customer) self-serve vs owner

The **same** path `POST /api/public/bookings` supports **unauthenticated** customers when **`ownerManualBooking` is omitted or false**. That flow is **not** described here. Mobile **owner** booking must always send **`ownerManualBooking: true`** and **Bearer** auth.

---

## Stripe / card checkout

Owner manual booking in the **web** app does not open Stripe Checkout on confirm; it uses the no-checkout POST with `paymentMethodSelected: "none"`. If you later add **customer-paid** booking from mobile, that will be a **different** contract (e.g. public booking checkout session + webhook) — not covered by this document.

---

## Mobile implementation checklist

- [ ] Present **From services** and **Custom job** as separate entry choices.
- [ ] Catalog: send `serviceId`, service name, selected option label/price, selected add-on snapshots, and total duration.
- [ ] Custom: omit `serviceId`; send owner-entered name, price cents, duration, and notes through `customer.notes`.
- [ ] Always send `ownerManualBooking: true` and a valid Supabase Bearer token.
- [ ] Always send the authenticated owner’s `businessId` and matching public `businessSlug`.
- [ ] Never send `bookingSource`; server persists `owner`.
- [ ] Email may be empty; phone remains required.
- [ ] Vehicle may be fully empty or fully populated—never partial.
- [ ] For mobile service, collect a complete five-digit-US-ZIP address.
- [ ] For shop service, address fields may be empty; server uses the business shop address.
- [ ] Keep submitted cents gross/pre-discount and include add-on time in total `durationMinutes`.
- [ ] Disable duplicate submits and handle `400`/`401`/`403`/`409` distinctly.
- [ ] On `201`, use `data.id` as the created booking identifier and refresh the bookings/calendar data.

---

## Related code

| Piece                     | Location                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Route handler             | `src/app/api/public/bookings/route.ts`                                             |
| Sale auto-apply (owner)   | [`mobile-owner-create-booking-sale.md`](./mobile-owner-create-booking-sale.md)     |
| Service location persist  | `src/features/availability/booking/utils/resolveBookingServiceLocationType.ts`     |
| Booking insert            | `src/features/availability/services/bookingService.ts` → `createBooking`           |
| Auth helper               | `src/libs/api/getAuthenticatedUser.ts`                                             |
| Owner business resolution | `src/server/resolveCurrentBusinessId.ts`                                           |
| Customer email            | `sendAvailabilityBookingCustomerConfirmationEmail` (availability booking template) |
