# Contract: Mobile — Owner quote inbox and detail

Use this after the native app sends a quote, or to show the owner's inbox and
quote detail.

The API returns a normalized camelCase `DashboardQuote`. Mobile does **not**
query the `quotes` table, `quote_outbound_events`, or public-link rows.

Web and mobile share this payload. New fields below (`assets`, `viewedAt`,
`customerReminderSentAt`, `communications`) are already on `GET /api/quotes`
and `GET /api/quotes/[id]`.

---

## How quotes work (server-owned)

Mobile creates or first-sends through the send contract. After that, this
server owns the customer path.

| Step                 | Who                                                              | What happens                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner sends          | Mobile → `POST /api/quotes/send` or `POST /api/quotes/[id]/send` | Quote is `sent`. Public `/q/` link is minted. Customer gets **email only** (best-effort). No SMS. `communications` stays `[]`.                       |
| Customer opens `/q/` | Public web                                                       | First open sets `status: viewed` and `viewedAt` (write-once).                                                                                        |
| 2–3 days, still open | Cron, not mobile                                                 | One customer **email + SMS** reminder. SMS includes the same `/q/` link. Claimed on `customerReminderSentAt`. Actual sends land in `communications`. |
| Customer approves    | Public `/q/`                                                     | Quote `approved`. Booking created with `booking_source = quote`. Address + final slot are collected here, not on send.                               |
| Customer declines    | Public `/q/`                                                     | Quote `declined`. No reminder after that.                                                                                                            |

Skip reminder if the quote is approved, declined, expired, or cancelled, or
if there is no live `/q/` link / no contact.

**Do not** send quote email or SMS from the app. **Do not** write `assets`,
`viewedAt`, or `communications` from the app.

---

## Assets (what the quote is about)

`quotes.assets` is quotes-only. Same idea as `customer_assets`, but it is a
snapshot on the quote, not a CRM row.

```ts
type QuoteAsset = {
  type: string;
  label: string;
  attributes: Record<string, unknown>;
};
```

| `type`          | When                                                                                     | `attributes` today                        |
| --------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `vehicle`       | Detailers / vehicle businesses (what we write now)                                       | `{ year, make, model }` (strings or null) |
| `pet`           | Reserved for groomers. Server can store it; public quote form does not collect pets yet. | `{ name, species, breed, size }`          |
| other / missing | Ignore the item or show `label` only                                                     | unknown                                   |

Rules for mobile:

- **Render `label`.** That is the display line (`2018 Honda Civic`).
- Prefer `assets` over `vehicleYear` / `vehicleMake` / `vehicleModel` /
  `vehicleLine` when `assets` is non-empty.
- Those four vehicle fields are **car 1 only**, kept for older clients and
  booking approve. They stay in sync with the first `vehicle` asset.
- `assets` is `null` or `[]` when the customer did not add a vehicle (or the
  business is a cleaner / lawn shop — the job is the address).
- Extra cars are more `vehicle` items. There is no `vehicle2Year` on this
  payload.
- Owner send still posts `vehicleYear` / `vehicleMake` / `vehicleModel` only.
  The server builds `assets`. Do **not** POST an `assets` array.
- Unknown `type` values must not crash the app. Show `label` and move on.

```ts
function quoteAssetLines(quote: DashboardQuote): string[] {
  if (quote.assets?.length) {
    return quote.assets.map(a => a.label.trim()).filter(Boolean);
  }
  return quote.vehicleLine?.trim() ? [quote.vehicleLine.trim()] : [];
}

/** Request / inbox card: first vehicle, then +N if there are more. */
function quoteAssetsCardLine(quote: DashboardQuote): string | null {
  const lines = quoteAssetLines(quote);
  if (lines.length === 0) return null;
  const extra = lines.length - 1;
  return extra > 0 ? `${lines[0]} +${extra}` : lines[0];
}
```

Inbox card example: `2018 Toyota Tacoma +1`. Detail lists every asset.

---

## Activity (owner timeline)

Build from the quote. Do not invent a local timeline.

| Event                  | Source                                                        |
| ---------------------- | ------------------------------------------------------------- |
| Created                | `createdAt`                                                   |
| Viewed                 | `viewedAt` (null until the customer opened `/q/`)             |
| Email sent / Text sent | each `communications` row (`channel` + `status`)              |
| Reminder claimed       | `customerReminderSentAt` — cron claim, not a per-channel send |

`communications` today is reminder traffic only (`type: "quote_reminder"`).
The original “your quote is ready” email is **not** in this list.

Right after send: `viewedAt: null`, `customerReminderSentAt: null`,
`communications: []`.

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
- `assets` (or `vehicleLine` for a single-line subtitle)
- `viewedAt`

Inbox filters (web and mobile should match):

| Filter         | Statuses             |
| -------------- | -------------------- |
| Requested      | `draft`, `requested` |
| Awaiting reply | `sent`, `viewed`     |
| Approved       | `approved`           |

Customer quote requests (`source === "customer_requested"` and
`status === "requested"`) belong in **Requested** on the main inbox. Declined,
expired, and cancelled quotes are not in these three filters.

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

  /** Car 1 only. Prefer `assets` when present. */
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleLine: string | null;
  /** Snapshot of vehicles (now) / pets (later). Null if none. */
  assets: Array<{
    type: string;
    label: string;
    attributes: Record<string, unknown>;
  }> | null;

  serviceStreet: string | null;
  serviceUnit: string | null;
  serviceCity: string | null;
  serviceState: string | null;
  serviceZip: string | null;
  serviceAddressLine: string | null;

  createdAt: string;
  activityAt: string;
  publicToken: string;
  publicLinkExpiresAt?: string | null;
  /** First customer open of `/q/`. Null until viewed. */
  viewedAt: string | null;
  /** One-shot customer reminder claim. Null until the cron claimed it. */
  customerReminderSentAt: string | null;
  /** Customer email/SMS we actually sent, oldest first. Empty until a send. */
  communications: Array<{
    channel: 'email' | 'sms';
    type: 'quote_reminder';
    status: 'sent' | 'failed';
    sentAt: string;
    toAddress: string | null;
  }>;
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

- `requestMessage` is the customer's ask, plus optional `Preferred timing: …`.
- Extra vehicles live on `assets`, not in that note. Older rows may still have
  a `Second vehicle: …` header in `requestMessage`; the API also folds that
  into `assets` when needed. Prefer `assets`.
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
    "vehicleYear": "2021",
    "vehicleMake": "Tesla",
    "vehicleModel": "Model 3",
    "vehicleLine": "2021 Tesla Model 3",
    "assets": [
      {
        "type": "vehicle",
        "label": "2021 Tesla Model 3",
        "attributes": { "year": "2021", "make": "Tesla", "model": "Model 3" }
      },
      {
        "type": "vehicle",
        "label": "2018 Honda Civic",
        "attributes": { "year": "2018", "make": "Honda", "model": "Civic" }
      }
    ],
    "serviceStreet": null,
    "serviceUnit": null,
    "serviceCity": null,
    "serviceState": null,
    "serviceZip": null,
    "serviceAddressLine": null,
    "createdAt": "2026-07-15T01:00:00.000Z",
    "activityAt": "2026-07-15T01:00:00.000Z",
    "publicToken": "<sensitive-active-link-token>",
    "viewedAt": null,
    "customerReminderSentAt": null,
    "communications": []
  }
}
```

---

## Related contracts

- [`mobile-quote-send.md`](./mobile-quote-send.md) — create / first-send payload
- [`service-categories-data.md`](./service-categories-data.md) — owner service catalog
- `src/features/quotes/docs/PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md` —
  customer request and approval lifecycle
