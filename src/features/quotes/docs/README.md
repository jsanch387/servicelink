# Quotes feature — developer & agent reference

Single place to see **where code lives**, **which HTTP APIs exist**, and **how create / edit / public view / respond** fit together. Keep this file updated when you add routes, tables, or flows.

---

## Schema (database)

| Doc | Contents |
|-----|----------|
| [QUOTES_TABLE.md](./QUOTES_TABLE.md) | `quotes` columns, statuses, owner vs customer request |
| [QUOTE_PUBLIC_LINKS_TABLE.md](./QUOTE_PUBLIC_LINKS_TABLE.md) | `quote_public_links`, token hash, expiry, RLS notes |

Business scope: quotes belong to `business_profiles` via `quotes.business_id`. Owner APIs resolve the current business with `src/server/resolveCurrentBusinessId.ts`.

---

## Feature folder map (`src/features/quotes/`)

| Path | Role |
|------|------|
| `components/CreateQuoteScreen.tsx` | **Create + edit** wizard (details → schedule → review → success). `mode="edit"` + `quoteId` loads quote and calls `PATCH /api/quotes/[id]`. |
| `components/NewQuoteCard.tsx` | Dashboard card linking to new quote. |
| `components/QuotesDashboardPage.tsx` | Re-export only; implementation lives in `dashboard/components/QuotesDashboardPage.tsx` (app imports from `@/features/quotes/components/...`). |
| `dashboard/` | Owner list, detail, filters, hooks, dashboard types, `loadDashboardQuoteById`, `mapQuoteRowToDashboardQuote`. |
| `dashboard/components/QuotesDashboardPage.tsx` | Quotes list UI (source for the re-export above). |
| `dashboard/components/QuoteListRow.tsx` | List card: customer, truncated **service** (with `title` for full text), **status**, **Created {date}** (`createdAt`), price. Sorted by `createdAt`. |
| `dashboard/components/QuoteDetailScreen.tsx` | Single quote; copy link, view public, **Edit**, **Delete** (`DELETE /api/quotes/[id]`). |
| `dashboard/components/DeleteQuoteModalBody.tsx` | Confirm-delete modal copy and actions. |
| `dashboard/utils/parseDeleteQuoteApiResponse.ts` | Parses delete API JSON for the client (unit-tested). |
| `dashboard/hooks/useDashboardQuotes.ts` | `GET /api/quotes`. |
| `dashboard/hooks/useDashboardQuoteDetail.ts` | `GET /api/quotes/[id]`; supports `{ enabled: false }` for create-only screens sharing the hook shape. |
| `dashboard/utils/isDashboardQuoteEditableByOwner.ts` | Owner may edit only `requested`, `draft`, `sent`, `viewed`. |
| `dashboard/utils/quoteFormHydrationFromDashboard.ts` | Map `DashboardQuote` → form defaults (local date, `HH:mm`, cents → dollars string, duration picker). |
| `dashboard/utils/publicQuoteUrl.ts` | Build `/q/...` path or absolute URL from dashboard token field. |
| `send/validateSendQuoteBody.ts` | Validates `businessSlug` + shared payload (POST send). |
| `edit/validateUpdateQuoteBody.ts` | Re-exports shared payload validation (PATCH). |
| `shared/validateQuotePayloadFields.ts` | **Shared** field rules for send + patch (customer, service, price, duration, schedule, phone). |
| `shared/utils/resolveQuoteTokenHash.ts` | Raw URL token → SHA-256 hex; 64-char hex passthrough (dashboard uses stored hash). |
| `public-view/validateQuoteRespondRequest.ts` | POST respond: `token`, `decision`, optional `serviceAddress` rules. |
| `public-view/components/PublicQuoteRespondActions.tsx` | Customer UI; `POST /api/quotes/respond`. |
| `public-request/components/PublicQuoteRequestScreen.tsx` | Public profile “request quote” flow (separate from dashboard create). |
| `hooks/useOwnerQuoteScheduling.ts` | Weekly schedule + time off for quote date/time picker. |
| `testing/*.test.ts` | Vitest: validation + `resolveQuoteTokenHash` (see [Tests](#tests)). |
| `index.ts` | Package exports for pages (`CreateQuoteScreen`, etc.). |

**Next.js app routes (outside `features/`)**

| App path | File | Purpose |
|----------|------|---------|
| `/dashboard/quotes` | `src/app/dashboard/quotes/page.tsx` | List |
| `/dashboard/quotes/new` | `src/app/dashboard/quotes/new/page.tsx` | Create (`CreateQuoteScreen`) |
| `/dashboard/quotes/[quoteId]` | `src/app/dashboard/quotes/[quoteId]/page.tsx` | Detail |
| `/dashboard/quotes/[quoteId]/edit` | `src/app/dashboard/quotes/[quoteId]/edit/page.tsx` | Edit (`CreateQuoteScreen` `mode="edit"`) |
| `/q/[token]` | `src/app/q/[token]/page.tsx` | **Public** quote view (server, admin client); increments view metadata; shows `PublicQuoteRespondActions` |

**Central route constants:** `src/constants/routes.ts` — `ROUTES.DASHBOARD.QUOTES`, `QUOTES_NEW`, `QUOTE_DETAIL(id)`, `QUOTE_EDIT(id)`.

---

## HTTP API reference

All JSON bodies use `Content-Type: application/json` unless noted.

### `POST /api/quotes/send`

**Auth:** Session required (`createSupabaseServerClient` user).

**Purpose:** Create a `quotes` row (`status: sent`), insert `quote_public_links` with hashed token, return customer URL.

**Body (validated by `validateSendQuoteBody`):**

| Field | Required | Notes |
|-------|----------|--------|
| `businessSlug` | yes | Must match a `business_profiles.business_slug` whose `profile_id` is the current user. |
| `customerName` | yes | |
| `customerEmail` | yes | Format validated. |
| `customerPhone` | optional | If present, must normalize to **10 digits** or validation fails. |
| `vehicleYear`, `vehicleMake`, `vehicleModel` | optional | |
| `serviceName` | yes | |
| `priceCents` | yes | Integer ≥ 0. |
| `durationMinutes` | yes | Integer > 0. |
| `note` | optional | |
| `scheduledDate` | yes | `YYYY-MM-DD`. |
| `scheduledStartTime` | yes | `HH:mm` (stored as `HH:mm:ss` in DB). |

**Success:** `201` — `{ success: true, data: { quoteId, publicUrl, expiresAt } }`  
`publicUrl` is `${origin}/q/${rawToken}` (raw token is **not** stored; DB stores SHA-256 hex).

**Typical errors:** `401` unauthorized, `400` validation, `404` business not found, `403` slug not owned by user, `500` insert/link failure.

**Code:** `src/app/api/quotes/send/route.ts`

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

**DB columns updated:** `customer_*`, `vehicle_*`, `service_name`, `price_cents`, `duration_minutes`, `note`, `scheduled_date`, `scheduled_start_time`, `updated_at`.

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

**Body (validated by `validateQuoteRespondRequest`):**

| Field | Required | Notes |
|-------|----------|--------|
| `token` | yes | Raw token from URL **or** hash-compatible string; resolved via `resolveQuoteTokenHash`. |
| `decision` | yes | `"approve"` \| `"decline"`. |
| `serviceAddress` | required if approve | Trimmed length ≥ 6 (combined address from UI). |

**Typical responses:** `200` `{ success, status, ... }` (includes `alreadyResponded` in some branches), `400` invalid body, `404` link/quote, `410` expired/revoked link, `409` conflicting state, `500`.

**Code:** `src/app/api/quotes/respond/route.ts`

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

1. Open `/q/[token]` (server render reads link + quote, may set `viewed`).
2. `PublicQuoteRespondActions` calls `POST /api/quotes/respond`.

---

## Validation modules (unit-test targets)

| Module | Used by |
|--------|---------|
| `shared/validateQuotePayloadFields.ts` | Send (after slug), PATCH |
| `send/validateSendQuoteBody.ts` | `POST /api/quotes/send` |
| `edit/validateUpdateQuoteBody.ts` | `PATCH /api/quotes/[id]` |
| `public-view/validateQuoteRespondRequest.ts` | `POST /api/quotes/respond` |

---

## Tests

Vitest includes `src/features/**/testing/**/*.test.ts` (see root `vitest.config.ts`).

| File | Covers |
|------|--------|
| `testing/sendQuoteValidation.test.ts` | `validateSendQuoteBody` (+ helpers) |
| `testing/quotePayloadValidation.test.ts` | Shared payload + send requires slug |
| `testing/quoteRespondValidation.test.ts` | `validateQuoteRespondRequest` |
| `testing/resolveQuoteTokenHash.test.ts` | Token vs hash resolution |
| `testing/deleteQuoteApiResponse.test.ts` | `parseDeleteQuoteApiResponse` |

Run: `npm test`

---

## Maintenance checklist

When you change behavior, update:

1. This `README.md` (API tables, flows, file paths).
2. `QUOTES_TABLE.md` / `QUOTE_PUBLIC_LINKS_TABLE.md` if schema or lifecycle changes.
3. Relevant tests under `src/features/quotes/testing/`.
