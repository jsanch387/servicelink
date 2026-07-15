# Contract: Mobile — Owner creates and sends quote

Use this when the **signed-in business owner** creates a new quote or **first-sends** an existing customer request from the native app. The server inserts/updates the `quotes` row, mints a public link, and **best-effort** emails the customer.

**Do not** insert quote rows directly from the app — you would skip link hashing, expiry, rate limits, and the customer email.

**Implementation**

| Piece                              | Path                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| New quote + link                   | `POST /api/quotes/send` → `src/app/api/quotes/send/route.ts`                                                         |
| First send (`requested` / `draft`) | `POST /api/quotes/[id]/send` → `src/app/api/quotes/[id]/send/route.ts`                                               |
| Shared validation                  | `validateSendQuoteBody` → `validateQuotePayloadFields` in `src/features/quotes/shared/validateQuotePayloadFields.ts` |
| Feature docs                       | `src/features/quotes/docs/README.md`, `QUOTES_TABLE.md`                                                              |

---

## Authentication (required)

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |

The access token is the same JWT the Expo app already uses for other authenticated API routes (e.g. owner manual booking, Stripe).

**Behavior:** `getAuthenticatedUser` resolves Bearer **or** cookies. Mobile must send **Bearer**. The body includes **`businessSlug`**; server loads `business_profiles` and requires **`profile_id === authenticated user id`**.

**Secrets:** Never send the Supabase **service role** key from mobile. Only **anon** + user **access token**.

---

## Endpoints

### A — New quote (insert + link)

|             |                                                                                    |
| ----------- | ---------------------------------------------------------------------------------- |
| **Method**  | `POST`                                                                             |
| **Path**    | `/api/quotes/send`                                                                 |
| **Success** | **`201`** — `{ "success": true, "data": { "quoteId", "publicUrl", "expiresAt" } }` |

`publicUrl` is `{origin}/q/{rawToken}` — share with the customer. The raw token is **not** stored in DB (only SHA-256 hash). `expiresAt` is ISO timestamp (**14 days** from send).

### B — First send for existing row

|             |                                             |
| ----------- | ------------------------------------------- |
| **Method**  | `POST`                                      |
| **Path**    | `/api/quotes/[id]/send`                     |
| **Success** | **`200`** — same `data` shape as Endpoint A |

Use when finishing a **customer-requested** quote (`status` is `requested` or `draft`). Same JSON body as Endpoint A.

If the quote is already `sent` or later, server returns **`409`** — use web dashboard `PATCH /api/quotes/[id]` to edit without minting a new link (PATCH currently uses cookie session on web; mobile edit support is a follow-up if needed).

---

## Request body (JSON)

Validated by `validateSendQuoteBody` → `validateQuotePayloadFields`.

### Customer + vehicle

| Field           | Type   | Required | Notes                                                                                   |
| --------------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| `businessSlug`  | string | Yes      | Must match a business owned by the caller (`business_profiles.profile_id = auth user`). |
| `customerName`  | string | Yes      | Trimmed.                                                                                |
| `customerEmail` | string | Yes      | Valid email format.                                                                     |
| `customerPhone` | string | No       | If present, **10 digits** after stripping non-digits; otherwise validation fails.       |
| `vehicleYear`   | string | No       | Optional snapshot fields.                                                               |
| `vehicleMake`   | string | No       |                                                                                         |
| `vehicleModel`  | string | No       |                                                                                         |
| `note`          | string | No       | Owner note on the quote; omit or empty → `null`.                                        |

**Not collected on send:** service street address. The customer provides address when accepting (`POST /api/quotes/respond`).

### Service — always required (custom or catalog)

| Field             | Type   | Required | Notes                                                 |
| ----------------- | ------ | -------- | ----------------------------------------------------- |
| `serviceName`     | string | Yes      | Display label stored on the quote.                    |
| `priceCents`      | number | Yes      | Integer ≥ 0. **Total** price (base + add-ons).        |
| `durationMinutes` | number | Yes      | Integer > 0. **Total** duration (base + add-on time). |

### Service — catalog snapshot (optional)

Send these when the owner picked a saved service from their catalog. Omit all for a fully **custom** quote.

| Field                  | Type   | Required | Notes                                                                             |
| ---------------------- | ------ | -------- | --------------------------------------------------------------------------------- |
| `serviceId`            | string | No       | UUID — `business_services.id`.                                                    |
| `servicePriceOptionId` | string | No       | UUID — `service_price_options.id` when a multi-price option was chosen.           |
| `servicePriceCents`    | number | No       | Integer ≥ 0. **Base** catalog price **before** add-ons (not the line-item total). |
| `addonDetails`         | array  | No       | Selected add-ons snapshot (see below).                                            |

**`addonDetails` item shape** (matches `quotes.addon_details` / bookings add-ons):

```json
{
  "id": "uuid-of-service_addons-row",
  "name": "Engine bay detail",
  "priceCents": 5000,
  "durationMinutes": 30
}
```

- `id` and `name` required; `priceCents` integer ≥ 0; `durationMinutes` optional positive integer.
- Server also accepts snake_case keys (`price_cents`, `duration_minutes`) and normalizes.
- Empty or invalid arrays are stored as `null`.

### Catalog naming convention

When the owner selects a **price option**, set:

- `serviceName` → `"{service.name} — {option.label}"` (em dash between name and label)
- `serviceId` → service UUID
- `servicePriceOptionId` → option UUID
- `servicePriceCents` → option base price (cents)
- `priceCents` → base + sum of selected add-on prices
- `durationMinutes` → base option duration + add-on durations

When the owner selects a service **without** price options:

- `serviceName` → service name only
- `serviceId` → service UUID
- `servicePriceCents` → service base price
- Omit `servicePriceOptionId`

**Custom quote:** send only `serviceName`, `priceCents`, `durationMinutes`; omit all catalog fields.

### Schedule (optional on send)

| Field                | Type   | Required | Notes                                             |
| -------------------- | ------ | -------- | ------------------------------------------------- |
| `scheduledDate`      | string | No\*     | `YYYY-MM-DD`.                                     |
| `scheduledStartTime` | string | No\*     | `HH:mm` (24h, zero-padded); stored as `HH:mm:ss`. |

\*Provide **both** date and time, or **omit both**. Sending only one returns **`400`**: `Provide both scheduled date and start time, or omit both`.

When schedule is omitted, the customer **chooses date and time when they approve** the quote on the public `/q/[token]` page (if the business has availability configured).

When schedule is provided, it is a **proposed** appointment; the customer may still confirm or pick a slot on accept depending on product rules.

---

## Loading the service catalog (mobile UI)

There is **no** dedicated HTTP catalog endpoint yet. The web dashboard loads catalog server-side via `loadQuoteServiceCatalog` (`src/features/quotes/server/loadQuoteServiceCatalog.ts`).

**Mobile should query Supabase** with the user's Bearer-scoped client (same pattern as other owner data). Tables:

| Table                       | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `business_services`         | Active services (`is_active = true`, `business_id`) |
| `service_price_options`     | Multi-price options (Pro only — see below)          |
| `service_addon_assignments` | Links services → add-ons                            |
| `service_addons`            | Add-on name, price, duration                        |

See also [`service-categories-data.md`](./service-categories-data.md) for categories and sort order.

**Pro gating:** Multi-price options are only enabled when the owner has Pro access **and** `price_options_enabled` is true on the service. Match web behavior: if not Pro, treat services as single-price only.

**Catalog type reference** (for UI parity with web):

```ts
type QuoteCatalogService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  categoryId: string | null;
  priceOptionsEnabled: boolean;
  priceOptions: {
    id: string;
    label: string;
    priceCents: number;
    durationMinutes: number;
  }[];
  addOns: {
    id: string;
    name: string;
    priceCents: number;
    durationMinutes: number | null;
  }[];
};
```

---

## Examples

### Custom quote, no schedule (customer picks on accept)

```http
POST /api/quotes/send
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
X-Request-ID: mobile-quote-001

{
  "businessSlug": "acme-detail",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "4155550100",
  "serviceName": "Full detail — SUV",
  "priceCents": 25000,
  "durationMinutes": 180,
  "note": "Includes clay bar"
}
```

### Catalog quote with option, add-ons, and proposed schedule

```json
{
  "businessSlug": "acme-detail",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "serviceName": "Full detail — Large SUV",
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
  "priceCents": 25000,
  "durationMinutes": 210,
  "scheduledDate": "2026-05-12",
  "scheduledStartTime": "09:30"
}
```

### First-send existing customer request

```http
POST /api/quotes/550e8400-e29b-41d4-a716-446655440000/send
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{ ...same body as new quote... }
```

---

## Success response

```json
{
  "success": true,
  "data": {
    "quoteId": "uuid",
    "publicUrl": "https://your-host/q/<raw-token>",
    "expiresAt": "2026-05-26T12:00:00.000Z"
  }
}
```

**Email:** After the quote and link exist, the API best-effort sends Resend email to `customerEmail`. If email fails, the HTTP response is still **201** / **200**; failures are logged server-side.

---

## Errors

| Status  | When                                                      |
| ------- | --------------------------------------------------------- |
| **400** | Invalid JSON, validation error (field message in `error`) |
| **401** | Missing/invalid Bearer                                    |
| **403** | `businessSlug` not owned by user                          |
| **404** | Business not found                                        |
| **409** | `[id]/send` — quote not in `requested` or `draft`         |
| **429** | Rate limit (see below)                                    |
| **500** | DB / unexpected failure                                   |

All JSON responses include **`X-Request-ID`** and **`Cache-Control: no-store`**.

---

## Rate limiting

Both send routes call `assertOwnerQuoteSendRateLimits` after auth, before heavy DB work.

| Bucket             | Limit     | Window         |
| ------------------ | --------- | -------------- |
| Per signed-in user | 60 sends  | sliding 1 hour |
| Per client IP      | 120 sends | sliding 1 hour |

**429** body: `{ "success": false, "error": "Too many quote sends…" }` + **`Retry-After`** header.

---

## Request tracing (recommended)

Send `X-Request-ID` or `X-Correlation-ID` (opaque string). Server echoes in logs for correlation with mobile crash reports.

**Do not** log full `publicUrl` or raw tokens in mobile analytics — use `quoteId` and masked email only.

---

## Customer accept flow (reference)

After send, the customer opens `publicUrl`. On approve they call **`POST /api/quotes/respond`** (no auth; token in body). If the quote had no schedule on send, they must supply `schedule` and `serviceAddress` when approving. See `src/features/quotes/public-view/validateQuoteRespondRequest.ts` and `PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md`.

---

## QA checklist (staging)

| Check                             | Expected                                   |
| --------------------------------- | ------------------------------------------ |
| No `Authorization`                | **401**                                    |
| Bad Bearer                        | **401**                                    |
| Wrong `businessSlug` owner        | **403** or **404**                         |
| Custom quote, no schedule         | **201** with `publicUrl`                   |
| Catalog fields + add-ons          | **201**; dashboard shows service + add-ons |
| Only `scheduledDate` without time | **400**                                    |
| `[id]/send` on already-sent quote | **409**                                    |
| >60 sends/hour (same user)        | **429** + `Retry-After`                    |

---

## Automated tests (server)

| File                                                          | Scope                        |
| ------------------------------------------------------------- | ---------------------------- |
| `src/features/quotes/testing/sendQuoteValidation.test.ts`     | Request JSON validation      |
| `src/features/quotes/testing/quoteServiceSnapshot.test.ts`    | `addonDetails` normalization |
| `src/features/quotes/testing/ownerQuoteSendRateLimit.test.ts` | Rate limit                   |
| `src/features/quotes/testing/quoteSendRouteLog.test.ts`       | Logging helpers              |

---

## Related

- [`mobile-quote-read.md`](./mobile-quote-read.md) — owner inbox/detail response and rendering rules
- [`src/features/quotes/docs/MOBILE_QUOTE_SEND_CONTRACT.md`](../../src/features/quotes/docs/MOBILE_QUOTE_SEND_CONTRACT.md) — feature-folder mirror of this doc
- [`mobile-owner-create-booking.md`](./mobile-owner-create-booking.md) — owner manual booking (different flow)
- [`service-categories-data.md`](./service-categories-data.md) — loading services for catalog UI
