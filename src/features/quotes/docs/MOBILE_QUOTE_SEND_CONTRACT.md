# Mobile ↔ Next.js contract — send quote + public link

Defines how the **native app** calls this Next.js server to **create or first-send** a quote and receive a **shareable customer URL**.

**Canonical copy (mobile contracts folder):** [`docs/contracts/mobile-quote-send.md`](../../../../docs/contracts/mobile-quote-send.md)

**Implementation files**

| Piece                                   | Path                                              |
| --------------------------------------- | ------------------------------------------------- |
| New quote + link                        | `src/app/api/quotes/send/route.ts`                |
| First send (`requested` / `draft`)      | `src/app/api/quotes/[id]/send/route.ts`           |
| Validation                              | `src/features/quotes/shared/validateQuotePayloadFields.ts` |
| Structured logs (no tokens / URLs)      | `src/features/quotes/server/quoteSendRouteLog.ts` |
| Rate limits (Upstash + memory fallback) | `src/server/rateLimit/ownerQuoteSendRateLimit.ts` |
| Full quotes API index                   | [README.md](./README.md)                          |

---

## Security

| Requirement                       | Detail                                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTPS**                         | All calls in production must use TLS.                                                                                                                                                           |
| **Auth**                          | **Supabase session** via **`Authorization: Bearer <access_token>`** (recommended for mobile) **or** Supabase auth cookies (web). Both are resolved by `getAuthenticatedUser` in route handlers. |
| **Business ownership**            | Body includes **`businessSlug`**. Server loads `business_profiles` and requires **`profile_id === authenticated user id`**.                                                                     |
| **Quote ownership** (`[id]/send`) | Quote **`id`** must belong to the same **`business_id`** as the authenticated user’s resolved business (see route handler).                                                                     |
| **Secrets**                       | **Never** send the Supabase **service role** key from mobile. Only **anon** + user **access token**.                                                                                            |
| **Service role**                  | Used **only** inside these route handlers on the server for inserts that bypass RLS; never exposed to clients.                                                                                  |

Do **not** log full customer emails or quote URLs (they contain the raw token) in mobile analytics; use IDs and masked emails where needed.

---

## Rate limiting

Both send routes call **`assertOwnerQuoteSendRateLimits`** after a successful auth check and **before** heavy database work.

| Bucket                             | Limit     | Window             |
| ---------------------------------- | --------- | ------------------ |
| Per **signed-in user** (`user.id`) | 60 sends  | sliding **1 hour** |
| Per **client IP** (`getClientIp`)  | 120 sends | sliding **1 hour** |

- **No Upstash yet:** If those env vars are **unset**, the handler **automatically** uses the in-memory limiter—**no extra setup**. Limits apply **per serverless instance** (weaker under heavy multi-instance abuse; fine for most early prod traffic).
- **With Upstash (optional later):** Set **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`** so limits are **shared** across all instances (same pattern as `publicApiRateLimit` and account delete).

When limited, response is **`429`** with JSON `{ "success": false, "error": "Too many quote sends…" }`, header **`Retry-After`** (seconds), and **`X-Request-ID`**. Server logs event **`rate_limited`** with `reason: "user" \| "ip"` (no raw tokens).

---

## Request tracing (recommended)

Send one of:

- `X-Request-ID: <opaque string>`
- `X-Correlation-ID: <opaque string>`

Server echoes tracing in structured logs (`requestId`) so Next.js logs and mobile logs can be correlated.

**Responses:** Every JSON response from these routes includes **`X-Request-ID`** and **`Cache-Control: no-store`**. Mobile should log the request id next to HTTP status on failures. Optional **`Retry-After`** on **429** only.

---

## Shared JSON body (both endpoints)

`Content-Type: application/json`

Validated by `validateSendQuoteBody` → `validateQuotePayloadFields` (`src/features/quotes/shared/validateQuotePayloadFields.ts`).

### Customer + vehicle

| Field                | Type   | Required | Notes                                                                      |
| -------------------- | ------ | -------- | -------------------------------------------------------------------------- |
| `businessSlug`       | string | yes      | Must match a business owned by the caller.                                 |
| `customerName`       | string | yes      | Trimmed.                                                                   |
| `customerEmail`      | string | yes      | Valid email format.                                                        |
| `customerPhone`      | string | no       | If present, **10 digits** after stripping non-digits, or validation fails. |
| `vehicleYear`        | string | no       | Optional.                                                                  |
| `vehicleMake`        | string | no       | Optional.                                                                  |
| `vehicleModel`       | string | no       | Optional.                                                                  |
| `note`               | string | no       | Owner note; omit or empty → stored as null.                                |

**Not** collected here: service street address (customer may supply when accepting the quote).

### Service (required)

| Field             | Type   | Required | Notes                                              |
| ----------------- | ------ | -------- | -------------------------------------------------- |
| `serviceName`     | string | yes      | Display label. Catalog with option: `Name — Label`. |
| `priceCents`      | number | yes      | Integer ≥ 0. **Total** (base + add-ons).           |
| `durationMinutes` | number | yes      | Integer > 0. **Total** duration.                   |

### Catalog snapshot (optional — omit for custom quotes)

| Field                  | Type   | Required | Notes                                                        |
| ---------------------- | ------ | -------- | ------------------------------------------------------------ |
| `serviceId`            | string | no       | UUID — `business_services.id`.                               |
| `servicePriceOptionId` | string | no       | UUID — `service_price_options.id` when option chosen.        |
| `servicePriceCents`    | number | no       | Integer ≥ 0. Base catalog price **before** add-ons.          |
| `addonDetails`         | array  | no       | `{ id, name, priceCents, durationMinutes? }[]` — see below.  |

**`addonDetails`:** Each item needs `id`, `name`, `priceCents` (≥ 0). `durationMinutes` optional. Server accepts `price_cents` / `duration_minutes` aliases.

### Schedule (optional on send)

| Field                | Type   | Required | Notes                                                                      |
| -------------------- | ------ | -------- | -------------------------------------------------------------------------- |
| `scheduledDate`      | string | no\*     | **`YYYY-MM-DD`**.                                                          |
| `scheduledStartTime` | string | no\*     | **`HH:mm`** (24h, zero-padded); stored as `HH:mm:ss` in DB.              |

\*Send **both** or **omit both**. If omitted, customer picks date/time when approving on `/q/[token]`.

---

## Endpoint A — New quote (insert + link)

**`POST /api/quotes/send`**

| Item           | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Success status | **`201`**                                                                                               |
| Success body   | `{ "success": true, "data": { "quoteId": string, "publicUrl": string, "expiresAt": string } }`          |
| `publicUrl`    | `{origin}/q/{rawToken}` — share this with the customer; token is **not** stored in DB (only a hash is). |
| `expiresAt`    | ISO timestamp for link expiry (server currently uses **14 days**).                                      |

Typical errors: **`401`** unauthorized / invalid Bearer, **`400`** validation / invalid JSON, **`403`** slug not owned by user, **`404`** business not found, **`429`** rate limit, **`500`** DB/email side effects.

---

## Endpoint B — First send for existing row (`requested` / `draft`)

**`POST /api/quotes/[id]/send`** — replace `[id]` with quote UUID.

Same JSON body as Endpoint A.

| Item           | Value                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Success status | **`200`**                                                                                      |
| Success body   | `{ "success": true, "data": { "quoteId": string, "publicUrl": string, "expiresAt": string } }` |

If the quote is **not** in `requested` or `draft`, server returns **`409`** with an error message (already sent — use `PATCH /api/quotes/[id]` to edit without minting a link; see main quotes README).

---

## Service catalog (mobile UI)

No dedicated HTTP catalog route yet. Load from Supabase with the owner's session (see `loadQuoteServiceCatalog` and [`docs/contracts/service-categories-data.md`](../../../../docs/contracts/service-categories-data.md)). Multi-price options require owner Pro access.

---

## Examples

### Custom quote, no schedule

```http
POST /api/quotes/send
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
X-Request-ID: mobile-abc-123

{
  "businessSlug": "acme-detail",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "4155550100",
  "serviceName": "Full detail",
  "priceCents": 25000,
  "durationMinutes": 180,
  "note": "Includes clay bar"
}
```

### Catalog quote with option + add-ons

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

Parse JSON response; on success store **`quoteId`**, display or share **`publicUrl`**.

---

## Server logging (safe for aggregators)

Handlers emit **`[quotes-send]`** + a JSON payload on the same line:

- Includes **`requestId`**, **`route`**, **`event`**, **`authMethod`** (`bearer` \| `cookie`), and operational fields (`quoteId`, `businessId`, `expiresAt`, masked customer email on success).
- **Never** logs raw quote URL, raw token, or full **`Authorization`** header.
- **Supabase / PostgREST:** logs **`supabaseCode`** always; **`supabaseMessageDev`** (truncated) **only when `NODE_ENV !== "production"`** to avoid leaking row/SQL fragments into production log sinks.
- **Forbidden:** logs **`userIdPrefix`** (first 8 chars of auth user id), not the full UUID.
- **Email provider errors:** truncated hint only (`emailErrorHint`).

---

## QA checklist (manual / staging)

| Check                                  | Expected                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| No `Authorization`, no cookies         | **401**, generic error, `X-Request-ID` set                 |
| Bad Bearer token                       | **401**                                                    |
| Valid user, wrong `businessSlug` owner | **403** or **404** per handler                             |
| Custom quote, no schedule              | **201** with `quoteId`, `publicUrl`, `expiresAt`           |
| Catalog + add-ons body                 | **201**; DB has `service_id`, `addon_details`              |
| Only date without time                 | **400**                                                    |
| Valid body                             | **201** / **200** with `quoteId`, `publicUrl`, `expiresAt` |
| Same user >60 sends / hour (staging)   | **429** + `Retry-After`                                    |
| Malformed JSON                         | **400** `Invalid JSON body`                                |
| Validation error                       | **400** with field-level message from validator            |

---

## Automated tests (what we have)

| File                                                          | Scope                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/features/quotes/testing/quoteSendRouteLog.test.ts`       | Request id, response headers, email mask, `supabaseErrorForLogs`, truncation helpers |
| `src/features/quotes/testing/ownerQuoteSendRateLimit.test.ts` | In-memory rate limit: 60 allows, 61st blocks (same user id)                          |
| `src/features/quotes/testing/sendQuoteValidation.test.ts`     | Request JSON validation (shared with routes)                                         |
| `src/features/quotes/testing/quoteServiceSnapshot.test.ts`    | `addonDetails` normalization                                                         |

**Not** covered in CI (would need integration harness): full `POST` with real Supabase + cookie/Bearer against a deployed URL. Rely on staging QA above for end-to-end.

---

## Related docs

- [README.md](./README.md) — full quotes API list
- [QUOTES_TABLE.md](./QUOTES_TABLE.md) — DB columns
- [`docs/contracts/mobile-quote-send.md`](../../../../docs/contracts/mobile-quote-send.md) — canonical mobile contract
