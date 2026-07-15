# Contract: Mobile — Owner quote inbox and detail

Use this contract after sending a quote when the native app needs to show the
owner's quote inbox and quote detail.

The API returns a normalized camelCase `DashboardQuote`; mobile does **not**
need to query the `quotes` table directly.

**Implementation**

| Purpose          | Endpoint               | Server file                                                           |
| ---------------- | ---------------------- | --------------------------------------------------------------------- |
| Quote inbox      | `GET /api/quotes`      | `src/app/api/quotes/route.ts`                                         |
| Quote detail     | `GET /api/quotes/[id]` | `src/app/api/quotes/[id]/route.ts`                                    |
| Response mapping | —                      | `src/features/quotes/dashboard/server/mapQuoteRowToDashboardQuote.ts` |
| Response type    | —                      | `src/features/quotes/dashboard/types.ts`                              |

---

## Authentication

Both endpoints accept:

```http
Authorization: Bearer <Supabase session access_token>
```

Web cookie sessions remain supported. The authenticated user can only read
quotes for the business whose `business_profiles.profile_id` matches their
user id.

Never use the Supabase service-role key in mobile.

---

## Quote inbox

```http
GET /api/quotes
Authorization: Bearer <supabase_access_token>
```

Success (`200`):

```json
{
  "success": true,
  "quotes": [
    {
      "...": "DashboardQuote"
    }
  ]
}
```

Quotes are ordered by `updatedAt` descending on the server. The normalized
response exposes that value as `activityAt`.

Recommended inbox fields:

- `id`
- `status`
- `source`
- `customerName`
- `serviceName`
- `totalCents`
- `activityAt`
- `scheduledDate`
- `scheduledTime`
- `serviceId`
- `addonDetails`

Use the detail endpoint after the owner opens a row.

---

## Quote detail

```http
GET /api/quotes/<quote-id>
Authorization: Bearer <supabase_access_token>
```

Success (`200`):

```json
{
  "success": true,
  "quote": {
    "...": "DashboardQuote"
  }
}
```

Errors:

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| `400`  | Missing quote id                                   |
| `401`  | Missing, invalid, or expired session               |
| `404`  | Business profile or business-owned quote not found |
| `500`  | Database or unexpected server failure              |

---

## `DashboardQuote` response

```ts
type QuoteStatus =
  | 'requested'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'cancelled';

type QuoteAddonDetail = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
};

type DashboardQuote = {
  id: string;
  status: QuoteStatus;
  source: 'owner_created' | 'customer_requested';

  customerName: string;
  customerEmail: string;
  customerPhone: string | null;

  serviceName: string;
  totalCents: number;
  durationMinutes: number;
  serviceId: string | null;
  servicePriceOptionId: string | null;
  servicePriceCents: number | null;
  addonDetails: QuoteAddonDetail[] | null;

  scheduledDate: string | null;
  scheduledTime: string | null;

  note: string | null;
  requestMessage: string | null;

  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleLine: string | null;

  serviceStreet: string | null;
  serviceUnit: string | null;
  serviceCity: string | null;
  serviceState: string | null;
  serviceZip: string | null;
  serviceAddressLine: string | null;

  createdAt: string;
  activityAt: string;
  publicToken: string;
};
```

`publicToken` is empty when no active, unexpired link exists. Treat a non-empty
value as sensitive link credentials; do not write it to analytics or logs.

---

## Rendering the service

### Custom versus catalog

No `job_type` field is required:

```ts
const isCustomQuote = quote.serviceId === null;
```

- `serviceId === null`: custom quote.
- `serviceId !== null`: saved catalog service.
- `servicePriceOptionId !== null`: a catalog price option was selected.

### Selected option label

For a selected price option, the immutable display snapshot is stored in
`serviceName` as:

```text
{base service name} — {selected option label}
```

Split on the first exact separator `" — "` for display:

```ts
function splitQuoteServiceName(value: string) {
  const [baseName, ...optionParts] = value.split(' — ');
  return {
    baseName,
    optionLabel: optionParts.join(' — ') || null,
  };
}
```

Use this stored label rather than reloading the current catalog label. The
catalog may have changed since the quote was sent.

### Price rows

- `servicePriceCents`: base service/selected-option snapshot before add-ons.
- `addonDetails`: add-on snapshots to render as individual rows.
- `totalCents`: final quote total; this is the authoritative total.

If `servicePriceCents` is `null` (custom or legacy quote), render one service
row using `serviceName` and `totalCents`.

### Duration

`durationMinutes` is the authoritative total appointment duration, including
any add-on duration that was included at send time.

---

## “Customer will choose” schedule state

No additional status or boolean is needed:

```ts
const customerWillChooseSchedule =
  quote.scheduledDate === null && quote.scheduledTime === null;
```

Render:

- both values `null` → **Customer will choose date and time**
- both values present → render the proposed/selected date and time

The send API rejects partial schedules, so new rows should not have only one
value. Handle a partial legacy row defensively as “schedule incomplete.”

After approval, the quote read response contains the date/time selected by the
customer and `status === "approved"`.

---

## Customer-requested quotes

For inbox items with `source === "customer_requested"`:

- `requestMessage` contains the customer's intake/request text.
- Initial status is normally `requested`.
- Owner first-send uses `POST /api/quotes/[id]/send`.

`note` is owner-authored quote text and is separate from `requestMessage`.

---

## Public-link action

When `publicToken` is non-empty, mobile may open or share:

```text
{webAppOrigin}/q/{encodeURIComponent(publicToken)}
```

Use the configured production web origin; do not derive it from the Supabase
URL. An empty `publicToken` means the API found no active, unexpired link.

---

## Example catalog detail

```json
{
  "success": true,
  "quote": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "sent",
    "source": "owner_created",
    "customerName": "Jane Doe",
    "customerEmail": "jane@example.com",
    "customerPhone": "4155550100",
    "serviceName": "Full detail — Large SUV",
    "totalCents": 25000,
    "durationMinutes": 210,
    "serviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "servicePriceOptionId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "servicePriceCents": 20000,
    "addonDetails": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "name": "Engine bay",
        "priceCents": 5000,
        "durationMinutes": 30
      }
    ],
    "scheduledDate": null,
    "scheduledTime": null,
    "note": "Includes clay bar",
    "requestMessage": null,
    "vehicleYear": null,
    "vehicleMake": null,
    "vehicleModel": null,
    "vehicleLine": null,
    "serviceStreet": null,
    "serviceUnit": null,
    "serviceCity": null,
    "serviceState": null,
    "serviceZip": null,
    "serviceAddressLine": null,
    "createdAt": "2026-07-15T01:00:00.000Z",
    "activityAt": "2026-07-15T01:00:00.000Z",
    "publicToken": "<sensitive-active-link-token>"
  }
}
```

---

## Related contracts

- [`mobile-quote-send.md`](./mobile-quote-send.md) — create / first-send payload
- [`service-categories-data.md`](./service-categories-data.md) — owner service catalog
- `src/features/quotes/docs/PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md` —
  customer request and approval lifecycle
