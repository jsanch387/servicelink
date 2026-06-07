# Quotes feature — developer & agent reference

Single place to see **where code lives**, **which HTTP APIs exist**, and **how create / edit / public view / respond** fit together. Keep this file updated when you add routes, tables, or flows.

---

## Schema (database)

| Doc                                                                                    | Contents                                                                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [MOBILE_QUOTE_SEND_CONTRACT.md](./MOBILE_QUOTE_SEND_CONTRACT.md)                       | **Mobile ↔ Next.js**: Bearer auth, JSON body, tracing headers, send / send-existing responses  |
| [QUOTES_TABLE.md](./QUOTES_TABLE.md)                                                   | `quotes` columns, statuses, owner vs customer request                                           |
| [QUOTE_PUBLIC_LINKS_TABLE.md](./QUOTE_PUBLIC_LINKS_TABLE.md)                           | `quote_public_links`, token hash, expiry, RLS notes                                             |
| [PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md](./PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md) | **Public quote request** intake vs **availability booking**, data flow, approve → V2 `bookings` |
| [BOOKINGS_CUSTOMER_ID.md](./BOOKINGS_CUSTOMER_ID.md)                                   | Why `bookings.customer_id` must exist when creating bookings from quotes                        |

Business scope: quotes belong to `business_profiles` via `quotes.business_id`. Owner APIs resolve the current business with `src/server/resolveCurrentBusinessId.ts`.

---

## Feature folder map (`src/features/quotes/`)

| Path                                                     | Role                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/CreateQuoteScreen.tsx`                       | **Create + edit** wizard (details → schedule → review → success). `mode="edit"` + `quoteId` loads quote and calls `PATCH /api/quotes/[id]`.          |
| `components/QuoteRequestsSettingsCard.tsx`               | Dashboard card: quote requests toggle + Pro upsell (public profile request button).                                                                  |
| `components/QuotesDashboardPage.tsx`                     | Re-export only; implementation lives in `dashboard/components/QuotesDashboardPage.tsx` (app imports from `@/features/quotes/components/...`).        |
| `dashboard/`                                             | Owner list, detail, filters, hooks, dashboard types, `loadDashboardQuoteById`, `mapQuoteRowToDashboardQuote`.                                        |
| `dashboard/components/QuotesDashboardPage.tsx`           | Quotes list UI (source for the re-export above).                                                                                                     |
| `dashboard/components/QuoteListRow.tsx`                  | List card: customer, truncated **service** (with `title` for full text), **status**, **Created {date}** (`createdAt`), price. Sorted by `createdAt`. |
| `dashboard/components/QuoteDetailScreen.tsx`             | Single quote; copy link, view public, **Edit**, **Delete** (`DELETE /api/quotes/[id]`).                                                              |
| `dashboard/components/DeleteQuoteModalBody.tsx`          | Confirm-delete modal copy and actions.                                                                                                               |
| `dashboard/utils/parseDeleteQuoteApiResponse.ts`         | Parses delete API JSON for the client (unit-tested).                                                                                                 |
| `dashboard/hooks/useDashboardQuotes.ts`                  | `GET /api/quotes`.                                                                                                                                   |
| `dashboard/hooks/useDashboardQuoteDetail.ts`             | `GET /api/quotes/[id]`; supports `{ enabled: false }` for create-only screens sharing the hook shape.                                                |
| `dashboard/utils/isDashboardQuoteEditableByOwner.ts`     | Owner may edit only `requested`, `draft`, `sent`, `viewed`.                                                                                          |
| `dashboard/utils/quoteFormHydrationFromDashboard.ts`     | Map `DashboardQuote` → form defaults (local date, `HH:mm`, cents → dollars string, duration picker).                                                 |
| `dashboard/utils/publicQuoteUrl.ts`                      | Build `/q/...` path or absolute URL from dashboard token field.                                                                                      |
| `send/validateSendQuoteBody.ts`                          | Validates `businessSlug` + shared payload (POST send).                                                                                               |
| `edit/validateUpdateQuoteBody.ts`                        | Re-exports shared payload validation (PATCH).                                                                                                        |
| `shared/validateQuotePayloadFields.ts`                   | **Shared** field rules for send + patch (customer, service, price, duration, schedule, phone).                                                       |
| `shared/utils/resolveQuoteTokenHash.ts`                  | Raw URL token → SHA-256 hex; 64-char hex passthrough (dashboard uses stored hash).                                                                   |
| `public-view/validateQuoteRespondRequest.ts`             | POST respond: `token`, `decision`, `serviceAddress` required when approving.                                                                         |
| `server/createBookingFromApprovedQuote.ts`               | Map approved quote → `createBooking` (V2 bookings + customer upsert).                                                                                |
| `server/quoteApprovalSideEffects.ts`                     | After approve: cap check, time-off, link `booking_id`, owner notify/email.                                                                           |
| `public-view/components/PublicQuoteRespondActions.tsx`   | Customer UI; `POST /api/quotes/respond`.                                                                                                             |
| `public-request/components/PublicQuoteRequestScreen.tsx` | Public profile “request quote” flow (separate from dashboard create).                                                                                |
| `hooks/useOwnerQuoteScheduling.ts`                       | Weekly schedule + time off for quote date/time picker.                                                                                               |
| `testing/*.test.ts`                                      | Vitest: validation + `resolveQuoteTokenHash` (see [Tests](#tests)).                                                                                  |
| `index.ts`                                               | Package exports for pages (`CreateQuoteScreen`, etc.).                                                                                               |

**Next.js app routes (outside `features/`)**

| App path                           | File                                               | Purpose                                                                                                   |
| ---------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/dashboard/quotes`                | `src/app/dashboard/quotes/page.tsx`                | List                                                                                                      |
| `/dashboard/quotes/new`            | `src/app/dashboard/quotes/new/page.tsx`            | Create (`CreateQuoteScreen`)                                                                              |
| `/dashboard/quotes/[quoteId]`      | `src/app/dashboard/quotes/[quoteId]/page.tsx`      | Detail                                                                                                    |
| `/dashboard/quotes/[quoteId]/edit` | `src/app/dashboard/quotes/[quoteId]/edit/page.tsx` | Edit (`CreateQuoteScreen` `mode="edit"`)                                                                  |
| `/q/[token]`                       | `src/app/q/[token]/page.tsx`                       | **Public** quote view (server, admin client); increments view metadata; shows `PublicQuoteRespondActions` |
| `/[business-slug]/quote`           | `src/app/[business-slug]/quote/page.tsx`           | **Public** “request quote” wizard (`PublicQuoteRequestScreen`) → `POST /api/public/quote-request`         |

**Central route constants:** `src/constants/routes.ts` — `ROUTES.DASHBOARD.QUOTES`, `QUOTES_NEW`, `QUOTE_DETAIL(id)`, `QUOTE_EDIT(id)`.

---

## HTTP API reference

All JSON bodies use `Content-Type: application/json` unless noted.

### `POST /api/quotes/send`

**Auth:** Session required — **Supabase cookies (web)** or **`Authorization: Bearer <access_token>` (mobile)** via `getAuthenticatedUser`.

**Rate limit / tracing:** After auth, **`assertOwnerQuoteSendRateLimits`** (per user + per IP, 1h sliding window; Upstash when `UPSTASH_REDIS_*` set). Responses include **`X-Request-ID`**, **`Cache-Control: no-store`**; **429** + **`Retry-After`** when throttled. Structured **`[quotes-send]`** logs (no raw quote URLs/tokens; Supabase message text only outside production). Contract: [MOBILE_QUOTE_SEND_CONTRACT.md](./MOBILE_QUOTE_SEND_CONTRACT.md).

**Purpose:** Create a `quotes` row (`status: sent`), insert `quote_public_links` with hashed token, return customer URL. **Service address is not collected here** — the customer enters it when they accept the quote (`POST /api/quotes/respond`).

**Body (validated by `validateSendQuoteBody`):**

| Field                                        | Required | Notes                                                                                  |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `businessSlug`                               | yes      | Must match a `business_profiles.business_slug` whose `profile_id` is the current user. |
| `customerName`                               | yes      |                                                                                        |
| `customerEmail`                              | yes      | Format validated.                                                                      |
| `customerPhone`                              | optional | If present, must normalize to **10 digits** or validation fails.                       |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | optional |                                                                                        |
| `serviceName`                                | yes      |                                                                                        |
| `priceCents`                                 | yes      | Integer ≥ 0.                                                                           |
| `durationMinutes`                            | yes      | Integer > 0.                                                                           |
| `note`                                       | optional |                                                                                        |
| `scheduledDate`                              | yes      | `YYYY-MM-DD`.                                                                          |
| `scheduledStartTime`                         | yes      | `HH:mm` (stored as `HH:mm:ss` in DB).                                                  |

**Success:** `201` — `{ success: true, data: { quoteId, publicUrl, expiresAt } }`  
`publicUrl` is `${origin}/q/${rawToken}` (raw token is **not** stored; DB stores SHA-256 hex).

**Email:** After the quote and link exist, the API **best-effort** sends **Resend** email to `customerEmail` (`sendQuoteSentToCustomerEmail` in `src/features/email/quote-sent-to-customer/`). HTML follows the same layout as the **customer appointment confirmation** (availability booking email): cards, typography, full-width **Review quote** button. If `RESEND_API_KEY` is missing or Resend fails, the response is still **201**; failures are logged with `console.warn`.

**Typical errors:** `401` unauthorized, `400` validation / invalid JSON, `404` business not found, `403` slug not owned by user, `429` rate limit, `500` insert/link failure.

**Code:** `src/app/api/quotes/send/route.ts`

---

### `POST /api/public/quote-request`

**Auth:** None (public). Uses **admin** Supabase client.

**Purpose:** Customer submits **Request quote** from the business profile (`/[businessSlug]/quote`). Inserts a `quotes` row with `source: customer_requested`, `status: requested`, `request_message` (timeline + details), `note: null`. **No** `quote_public_links` row until the owner sends the quote.

**Body:** Validated by `validatePublicQuoteRequestBody` (`public-request/validatePublicQuoteRequestBody.ts`).

**Success:** `201` — `{ success: true, data: { quoteId } }`.

**Code:** `src/app/api/public/quote-request/route.ts` → `insertCustomerQuoteRequest`

**See:** [PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md](./PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md)

---

### `POST /api/quotes/[id]/send`

**Auth:** Same as `POST /api/quotes/send` (cookies or **Bearer**); business must own the quote (slug + `resolveCurrentBusinessId`).

**Rate limit / tracing:** Same as `POST /api/quotes/send` (`assertOwnerQuoteSendRateLimits`, `X-Request-ID`, **429** + `Retry-After`).

**Purpose:** **First send** for an existing row in `requested` or `draft` (e.g. customer request the owner finishes in `CreateQuoteScreen`). Updates the quote to `sent`, creates/revokes links like `POST /api/quotes/send`, emails the customer. Same payload shape as send + `businessSlug`.

**Code:** `src/app/api/quotes/[id]/send/route.ts` → `sendExistingQuoteAsSent`

**See:** [PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md](./PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md)

---

### `GET /api/quotes`

**Auth:** Session + `resolveCurrentBusinessId`.

**Success:** `{ success: true, quotes: DashboardQuote[] }` (newest `updated_at` first). Each quote includes the **newest active** public link’s `token_hash` as `publicToken` for dashboard URL helpers (see [Tokens](#public-link-tokens)).

**Code:** `src/app/api/quotes/route.ts`

---

### `GET /api/quotes/[id]`

**Auth:** Session + business scope; quote must belong to current business.

**Success:** `{ success: true, quote: DashboardQuote }`.

**Errors:** `400` missing id, `404` not found, `401/403` via `resolveCurrentBusinessId`, `500`.

**Code:** `src/app/api/quotes/[id]/route.ts` → `loadDashboardQuoteById`

---

### `PATCH /api/quotes/[id]`

**Auth:** Same as GET.

**Purpose:** Update quote fields **without** creating a new link. Customer keeps the same `/q/[token]` URL; next page load shows new data.

**Precondition:** `isDashboardQuoteEditableByOwner(quote.status)` — only `requested`, `draft`, `sent`, `viewed`. Otherwise **`409`** with message about customer response.

**Body:** Same fields as send **except** `businessSlug` (validated by `validateUpdateQuoteBody` / `validateQuotePayloadFields`).

**DB columns updated:** `customer_*` (name/email/phone), `vehicle_*`, `service_name`, `price_cents`, `duration_minutes`, `note`, `scheduled_date`, `scheduled_start_time`, `updated_at`. **`request_message` is not updated** by PATCH (customer intake text). (Service address columns are **not** changed here — the customer sets them when they accept the quote.)

**Success:** `{ success: true, quote: DashboardQuote }` (reloaded after update).

**Code:** `src/app/api/quotes/[id]/route.ts`

---

### `DELETE /api/quotes/[id]`

**Auth:** Session + business scope (same as GET/PATCH).

**Purpose:** Permanently remove the quote row. Related `quote_public_links` rows are removed by DB `ON DELETE CASCADE` (see [QUOTE_PUBLIC_LINKS_TABLE.md](./QUOTE_PUBLIC_LINKS_TABLE.md)).

**Body:** None.

**Success:** `200` — `{ success: true }`.

**Errors:** `400` missing id, `404` quote not found (or not in this business), `401/403` via `resolveCurrentBusinessId`, `500` delete failure.

**UI:** Quote detail → **Delete quote** → modal (“Are you sure…”) → **Delete quote** / **Cancel** → on success, navigate to quotes list and `router.refresh()`.

**Code:** `src/app/api/quotes/[id]/route.ts`

---

### `POST /api/quotes/respond`

**Auth:** None (token proves access). Uses **admin** Supabase client server-side.

**Purpose:** Customer approve/decline; updates `quotes` + `quote_public_links` response fields.

**Approve side effects:** When the customer approves (`status` was `sent` or `viewed`), the route atomically sets `quotes.status` to `approved`, stores `service_address` (legacy DBs without that column fall back to appending the address on `note`), then:

1. Creates a V2 **`bookings`** row via `createBooking` (`service_name` from free-text quote; `service_id` null). **`quotes.booking_id`** is set only if the row still had no booking (avoids duplicate bookings under concurrent requests).
2. Upserts **`customers`** for that business through the same path as public availability bookings (`upsertCustomerForBooking`); `phone` is stored as digits-only when present.
3. Applies the same **free-tier lifetime booking cap** as `POST /api/public/bookings` (check before insert; counter increments only after the quote is successfully linked to the booking).
4. Blocks approval if the slot overlaps the business’s **time-off** blocks (same check as public booking).
5. Updates **`quote_public_links`** (`response_status`, `responded_at`) and notifies the owner with the **availability booking** email + in-app notification (`notifyOwnerForAvailabilityBookingCreated`), matching the public booking flow. No customer confirmation email is sent on approve.

**Repair:** If a quote is already `approved` but `booking_id` is still null (e.g. partial failure), a later approve request can complete booking creation and linking.

**Body (validated by `validateQuoteRespondRequest`):**

| Field            | Required               | Notes                                                                                          |
| ---------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `token`          | yes                    | Raw token from URL **or** hash-compatible string; resolved via `resolveQuoteTokenHash`.        |
| `decision`       | yes                    | `"approve"` \| `"decline"`.                                                                    |
| `address`        | preferred when approve | `{ street, unit?, city, state, zip }` — same shape as public UI (`quoteRespondAddress` rules). |
| `serviceAddress` | legacy approve         | Single line, trimmed length ≥ 6, used when `address` is omitted.                               |

**Typical responses:** `200` `{ success, status, ... }` (includes `alreadyResponded` in some branches), `400` invalid body, `403` free-tier cap, `404` link/quote, `409` conflicting state / time no longer available, `410` expired/revoked link, `500`.

**Code:** `src/app/api/quotes/respond/route.ts` — booking helpers: `src/features/quotes/server/createBookingFromApprovedQuote.ts`, `src/features/quotes/server/quoteApprovalSideEffects.ts`.

---

## Public link tokens

- **Sent to customer:** URL path `/q/[token]` where `token` is the **raw** base64url string from send.
- **Stored in DB:** `quote_public_links.token_hash` = SHA-256 hex of raw token.
- **`resolveQuoteTokenHash(input)`:** If `input` is already 64-char hex, treat as hash (lowercased); else hash the string. Used by **respond** route and **public page** lookup.
- **Dashboard `publicToken`:** From API mapping, this is often the **hash** (for owners who copy “preview” links backed by hash) — `getPublicQuoteAbsoluteUrl` / `getPublicQuotePath` in `dashboard/utils/publicQuoteUrl.ts` build the path the UI expects. If your product standard is always raw links for customers, keep send/copy flows aligned with that.

---

## UI flows (owner)

1. **Create:** `/dashboard/quotes/new` → `CreateQuoteScreen` → `POST /api/quotes/send` → success shows `publicUrl`.
2. **List:** `QuotesDashboardPage` → `GET /api/quotes`.
3. **Detail:** `QuoteDetailScreen` → `GET /api/quotes/[id]` via `useDashboardQuoteDetail`.
4. **Edit:** `/dashboard/quotes/[id]/edit` → same `CreateQuoteScreen` with `mode="edit"` → hydrate from quote → `PATCH /api/quotes/[id]` → success → link back to detail.

Scheduling reuses availability data: `useOwnerQuoteScheduling`, `usePublicBlockedSlots(businessSlug)` inside `CreateQuoteScreen`.

---

## UI flows (customer)

1. **Request quote (optional):** `/[businessSlug]/quote` → `PublicQuoteRequestScreen` → `POST /api/public/quote-request` (see [PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md](./PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md)).
2. **Review sent quote:** Open `/q/[token]` (server render reads link + quote, may set `viewed`).
3. `PublicQuoteRespondActions` calls `POST /api/quotes/respond`.

---

## Validation modules (unit-test targets)

| Module                                             | Used by                          |
| -------------------------------------------------- | -------------------------------- |
| `shared/validateQuotePayloadFields.ts`             | Send (after slug), PATCH         |
| `send/validateSendQuoteBody.ts`                    | `POST /api/quotes/send`          |
| `edit/validateUpdateQuoteBody.ts`                  | `PATCH /api/quotes/[id]`         |
| `public-view/validateQuoteRespondRequest.ts`       | `POST /api/quotes/respond`       |
| `public-request/validatePublicQuoteRequestBody.ts` | `POST /api/public/quote-request` |

---

## Tests

Vitest includes `src/features/**/testing/**/*.test.ts` (see root `vitest.config.ts`).

| File                                      | Covers                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `testing/sendQuoteValidation.test.ts`     | `validateSendQuoteBody` (+ helpers)                                                                           |
| `testing/quotePayloadValidation.test.ts`  | Shared payload + send requires slug                                                                           |
| `testing/quoteRespondValidation.test.ts`  | `validateQuoteRespondRequest`                                                                                 |
| `testing/resolveQuoteTokenHash.test.ts`   | Token vs hash resolution                                                                                      |
| `testing/quoteStartTimeToHHmm.test.ts`    | `quoteStartTimeToHHmm` (DB time → `HH:mm`)                                                                    |
| `testing/deleteQuoteApiResponse.test.ts`  | `parseDeleteQuoteApiResponse`                                                                                 |
| `testing/quoteSendRouteLog.test.ts`       | `getQuoteSendRequestId`, `maskEmailForLog`, `quoteSendJsonResponse`, `supabaseErrorForLogs`, safe log helpers |
| `testing/ownerQuoteSendRateLimit.test.ts` | `assertOwnerQuoteSendRateLimits` memory path (61st call blocked)                                              |

Run: `npm test`

---

## Maintenance checklist

When you change behavior, update:

1. This `README.md` (API tables, flows, file paths).
2. `PUBLIC_QUOTE_REQUEST_AND_BOOKING_FLOW.md` if public request, send-existing, or approve→booking behavior changes.
3. `QUOTES_TABLE.md` / `QUOTE_PUBLIC_LINKS_TABLE.md` if schema or lifecycle changes.
4. Relevant tests under `src/features/quotes/testing/`.
