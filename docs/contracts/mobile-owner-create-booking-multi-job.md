# Contract: Mobile — Owner creates multi-job appointment (one visit)

**Status:** Server implemented (appointment-centric).  
**Parent:** [`mobile-owner-create-booking.md`](./mobile-owner-create-booking.md)  
**Sale rules:** [`mobile-owner-create-booking-sale.md`](./mobile-owner-create-booking-sale.md)  
**SQL (run once in Supabase):** [`sql/owner_manual_booking_multi_job_migration.sql`](./sql/owner_manual_booking_multi_job_migration.sql)

Use this when the signed-in owner schedules **one appointment** that can include **1…N jobs** (e.g. two cars, three dogs).

## Product model

| Concept         | Meaning                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Appointment** | One calendar block: one customer, one place, one start time, one status, one payment                               |
| **Job**         | A line item inside that appointment: service (or custom), price, optional tier/add-ons, duration, optional vehicle |

- Appointment duration = **sum** of job durations (2×2h jobs → 4h appointment).
- Cancel / complete / pay = **the appointment** (one booking id).
- Free-tier counts **one visit** per create (not per job).

Legacy single-job body (no `jobs`) still works. Prefer `jobs[]` for all owner creates going forward (including length 1).

---

## Endpoint

|                     |                                           |
| ------------------- | ----------------------------------------- |
| **Method**          | `POST`                                    |
| **Path**            | `/api/public/bookings`                    |
| **Example (local)** | `https://<your-host>/api/public/bookings` |

Same path as the parent owner-create contract.

---

## Authentication (required)

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |

`ownerManualBooking` must be `true`. Owner must own `businessId`.

`jobs[]` is **owner-only**. Public/customer booking with `jobs` → **400**.

---

## Request body

### Appointment-level fields

| Field                   | Type    | Required | Notes                                                                                                     |
| ----------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `businessSlug`          | string  | Yes      | Public slug                                                                                               |
| `businessId`            | string  | Yes      | UUID; must match owner + slug                                                                             |
| `scheduledDate`         | string  | Yes      | `YYYY-MM-DD`                                                                                              |
| `startTime`             | string  | Yes      | Appointment start (`H:mm` / `HH:mm`) — **one** start for the whole visit                                  |
| `customer`              | object  | Yes      | Who / address / notes. **Do not** put vehicle on `customer` when using `jobs` — use each job’s `vehicle`. |
| `paymentMethodSelected` | string  | No       | `"none"` for owner                                                                                        |
| `ownerManualBooking`    | boolean | Yes      | `true`                                                                                                    |
| `serviceLocationType`   | string  | Yes\*    | `"mobile"` \| `"shop"`                                                                                    |
| `jobs`                  | array   | Yes      | 1…20 items                                                                                                |

\*Same location rules as parent contract.

**Do not send** top-level `serviceName` / `serviceId` / `servicePriceCents` / `durationMinutes` / `selectedAddOns` / `servicePriceOptionLabel` when `jobs` is present.

**Notes:** `customer.notes` is appointment notes only. Do **not** prefix with `Visit job N of M`.

### Each `jobs[]` item

| Field                     | Type   | Required | Notes                                                               |
| ------------------------- | ------ | -------- | ------------------------------------------------------------------- |
| `serviceName`             | string | Yes      | Catalog or custom display name                                      |
| `serviceId`               | string | Catalog  | Omit / null for custom                                              |
| `servicePriceOptionLabel` | string | No       | Real tier label only; omit for base / custom                        |
| `servicePriceCents`       | number | Yes      | Integer ≥ 0. **Owner-edited price wins**                            |
| `selectedAddOns`          | array  | No       | `{ id, name, priceCents, durationMinutes? }`; empty/omit for custom |
| `durationMinutes`         | number | Yes      | This job only. Integer ≥ 1. Appointment duration = sum              |
| `vehicle`                 | object | No       | `{ year, make, model }` strings; all empty or all set               |
| `clientJobId`             | string | No       | Mobile local id — **not persisted** in v1                           |

Optional sale **preview** fields on each job are **ignored**. Server applies sale once to the **appointment** subtotal (sum of all job gross amounts).

**Custom job:** omit `serviceId`; no option label; no add-ons (server **rejects** if present).

### Example — two vehicles / two services (one appointment)

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "scheduledDate": "2026-08-12",
  "startTime": "09:00",
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
    "notes": "Gate code 4421"
  },
  "jobs": [
    {
      "serviceId": "uuid-catalog-service",
      "serviceName": "Full detail",
      "servicePriceOptionLabel": "SUV",
      "servicePriceCents": 22500,
      "selectedAddOns": [
        {
          "id": "uuid-addon",
          "name": "Pet hair",
          "priceCents": 2500,
          "durationMinutes": 15
        }
      ],
      "durationMinutes": 135,
      "vehicle": {
        "year": "2022",
        "make": "Toyota",
        "model": "Highlander"
      }
    },
    {
      "serviceName": "Touch-up paint",
      "servicePriceCents": 7500,
      "durationMinutes": 45,
      "vehicle": {
        "year": "2018",
        "make": "Honda",
        "model": "Civic"
      }
    }
  ]
}
```

Server stores **one** `bookings` row:

- `start_time` = `09:00`
- `duration_minutes` = `180` (135 + 45)
- `job_details` = the two jobs (JSON)
- `visit_job_count` = `2`
- `visit_id` = booking `id`
- one `booking_payments` row for the appointment total

### Example — single custom job via `jobs` (preferred going forward)

```json
{
  "businessSlug": "acme-detail",
  "businessId": "uuid-of-business_profiles-row",
  "scheduledDate": "2026-08-12",
  "startTime": "14:00",
  "paymentMethodSelected": "none",
  "ownerManualBooking": true,
  "serviceLocationType": "shop",
  "customer": {
    "fullName": "Sam Rivera",
    "email": "",
    "phone": "5559876543",
    "streetAddress": "",
    "unitApt": "",
    "city": "",
    "state": "",
    "zip": "",
    "notes": ""
  },
  "jobs": [
    {
      "serviceName": "Headlight restore",
      "servicePriceCents": 12000,
      "durationMinutes": 60,
      "vehicle": { "year": "2015", "make": "Ford", "model": "F-150" }
    }
  ]
}
```

---

## What the server does

1. Validates appointment + each job.
2. Free-tier **+1** once (one appointment).
3. Inserts **one** `bookings` row with `job_details`, `duration_minutes` = sum of jobs, one `start_time`.
4. Inserts **one** `booking_payments` row for the appointment gross total.
5. Applies sale once to the appointment subtotal (Pro).
6. Sends **one** customer email (if email present) and **one** owner notification listing jobs + appointment total.
7. Rejects if start + total duration would spill past midnight (same calendar day).

---

## Success response

**HTTP:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid-appointment-booking",
    "visitId": "uuid-appointment-booking",
    "jobCount": 2
  }
}
```

| Field      | Notes                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------ |
| `id`       | The appointment booking id — use for cancel, complete, pay, cache invalidation, deep links |
| `visitId`  | Same as `id` for new appointments                                                          |
| `jobCount` | Number of jobs in `job_details`                                                            |

There is **no** `bookingIds` array of multiple rows — one appointment = one id.

Legacy single-job body (no `jobs`) returns the same shape with `jobCount: 1`.

---

## Error responses

| HTTP  | Typical cause                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `400` | Invalid jobs, missing fields, custom+add-ons, partial vehicle, appointment past midnight, location/customer validation |
| `401` | Missing/invalid Bearer                                                                                                 |
| `403` | Not owner, or free-tier cap                                                                                            |
| `404` | Business not found                                                                                                     |
| `500` | Unexpected failure (booking rolled back)                                                                               |

Owner schedule override: no `409` for time-off / lead time.

---

## Mobile implementation checklist

- [ ] Build body with appointment fields + `jobs[]` (even for length 1).
- [ ] Submit **one** POST (remove per-job loop / note prefix / client start-time stagger).
- [ ] Always send `ownerManualBooking: true` + Bearer token.
- [ ] Put vehicles on each job, not on `customer`.
- [ ] Appointment duration is implied by sum of job durations — do not send top-level `durationMinutes` with `jobs`.
- [ ] On `201`, use `data.id` as the appointment id (cancel / complete / pay / refresh).
- [ ] Free-tier: one create = one visit.

---

## TypeScript shapes (canonical)

```ts
type OwnerCreateAppointmentRequest = {
  businessSlug: string;
  businessId: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // H:mm or HH:mm — appointment start
  paymentMethodSelected?: 'none';
  ownerManualBooking: true;
  serviceLocationType: 'mobile' | 'shop';
  customer: {
    fullName: string;
    email: string;
    phone: string;
    streetAddress: string;
    unitApt: string;
    city: string;
    state: string;
    zip: string;
    notes: string;
  };
  jobs: Array<{
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
    vehicle?: { year: string; make: string; model: string };
    clientJobId?: string;
  }>;
};

type OwnerCreateAppointmentResponse =
  | {
      success: true;
      data: {
        id: string;
        visitId: string;
        jobCount: number;
      };
    }
  | { success: false; error: string; errorCode?: string };
```

---

## Related server code

| Piece                        | Location                                                             |
| ---------------------------- | -------------------------------------------------------------------- |
| Route                        | `src/app/api/public/bookings/route.ts`                               |
| Job parse / duration helpers | `src/features/availability/booking/utils/ownerManualBookingJobs.ts`  |
| Insert                       | `createBooking` in `bookingService.ts` (`job_details` jsonb)         |
| Parent single-job contract   | [`mobile-owner-create-booking.md`](./mobile-owner-create-booking.md) |
