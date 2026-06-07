# Mobile ↔ Next.js contract — send quote + public link

Defines how the **native app** (or any non-browser client) calls this Next.js server to **create or first-send** a quote and receive a **shareable customer URL**.

**Implementation files**

| Piece                                   | Path                                              |
| --------------------------------------- | ------------------------------------------------- |
| New quote + link                        | `src/app/api/quotes/send/route.ts`                |
| First send (`requested` / `draft`)      | `src/app/api/quotes/[id]/send/route.ts`           |
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

| Field                | Type   | Required | Notes                                                                      |
| -------------------- | ------ | -------- | -------------------------------------------------------------------------- |
| `businessSlug`       | string | yes      | Must match a business owned by the caller.                                 |
| `customerName`       | string | yes      | Trimmed.                                                                   |
| `customerEmail`      | string | yes      | Valid email format.                                                        |
| `customerPhone`      | string | no       | If present, **10 digits** after stripping non-digits, or validation fails. |
| `vehicleYear`        | string | no       | Optional.                                                                  |
| `vehicleMake`        | string | no       | Optional.                                                                  |
| `vehicleModel`       | string | no       | Optional.                                                                  |
| `serviceName`        | string | yes      | Free-text service label.                                                   |
| `priceCents`         | number | yes      | Integer ≥ 0.                                                               |
| `durationMinutes`    | number | yes      | Integer > 0.                                                               |
| `note`               | string | no       | Owner note; omit or empty → stored as null.                                |
| `scheduledDate`      | string | yes      | **`YYYY-MM-DD`**.                                                          |
| `scheduledStartTime` | string | yes      | **`HH:mm`** (24h); stored as `HH:mm:ss` in DB.                             |

**Not** collected here: service street address (customer may supply when accepting the quote).

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

## Example (mobile pseudocode)

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
  "note": "Includes clay bar",
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

**Not** covered in CI (would need integration harness): full `POST` with real Supabase + cookie/Bearer against a deployed URL. Rely on staging QA above for end-to-end.

---

## Related docs

- [README.md](./README.md) — full quotes API list
- [QUOTES_TABLE.md](./QUOTES_TABLE.md) — DB columns
