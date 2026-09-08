# Google reviews — import and display

Owners can show **all** of their Google Business Profile reviews on their ServiceLink public page. This is a **second source** next to ServiceLink-native reviews (invite after a completed job). It is not a replacement for those invites.

**Related:** [FLOWS.md](./FLOWS.md) (native invite flow), [DATABASE.md](./DATABASE.md), [SERVER.md](./SERVER.md).

---

## Parked — read this next time (Sep 8, 2026)

v1 **app code is done** on branch `google-reviews-integration`. Live pull is blocked on Google, not on us.

**Why quota is 0:** we did **not** fail a quota-increase request. New Cloud projects start at **Requests per minute = 0** until Google **allowlists** the project. Enabling the API in the console does nothing. **Edit Quotas** on that row also does nothing. You have to apply for **Business Profile API access** first.

**Current case:** `6-3847000041545`  
Submitted **Sep 8, 2026** via [GBP API contact form](https://support.google.com/business/contact/api_default) → **Application for Basic API Access**. Google said **7–10 business days**. That case will **not** appear in Cloud Console support — only in the confirmation email. An earlier case (`3-0566000041119`, Aug 22) disappeared; treat it as gone.

**When you come back**

1. Cloud Console → ServiceLink → **APIs & Services → Enabled APIs → My Business Account Management API → Quotas**.
2. **Requests per minute**
   - still **0** → not approved yet. Do not click Pull. Do not Edit Quotas.
   - **300** (or anything > 0) → approved. Continue below.
3. Restore the missing SQL files if they are still absent (`docs/migrations/` is empty; tables already exist in production).
4. Reviews → **Connect to Google** → **Pull Google reviews**. `google_business_connections` and `google_reviews` are **0 rows** — reconnect is required.
5. Confirm inbox (Google label) + public Reviews tab.

ServiceLink listing was verified **Aug 22, 2026**. Google’s form wants 60+ days; if this case is rejected for age, reapply around **Oct 21** with the Cloud **project number** (digits), listing owner/manager email.

---

## Product

| In v1 | Out of v1 |
| ----- | --------- |
| Owner connects the Google account that manages their listing | Places API (~5 public reviews, no caching of bodies) |
| One click pulls every Google review we can page | Dumping Google rows into `reviews` (`booking_id` / `review_invite_id`) |
| Reviews show in the dashboard inbox and public Reviews tab | Owner reply / hide from ServiceLink |
| ServiceLink star average stays ServiceLink-only | Sending customers to Google after a job |
| Google reviews are labeled **Google** | Multi-listing picker |

**Owner flow**

1. `/dashboard/reviews` → **Connect to Google** → Google OAuth.
2. **Pull Google reviews** → we find the listing and import reviews.

There is no “find my listing” step in the UI. Listing lookup is server-side inside pull (and also attempted on the OAuth callback).

---

## How we know which listing to pull

Two IDs, neither typed by the owner:

| ID | Source |
| -- | ------ |
| ServiceLink `business_id` | Signed-in dashboard session (`resolveCurrentBusinessId`). Stored in signed OAuth `state` at Connect. |
| Google location | The Google account they just authorized. We list accounts, then locations, and take the **first** location Google returns. |

If that Google account manages more than one listing, we silently use the first. A picker is only needed later for multi-location owners.

Connect can succeed even when listing lookup fails (quota 0). Pull retries lookup, then pages reviews.

---

## Owner UI

Card: `ReviewsGoogleConnectCard` on `ReviewsDashboardPage`. Copy: `dashboard/copy/googleConnectCopy.ts`. Hook: `useGoogleBusinessConnection`.

| State | What they see |
| ----- | ------------- |
| Not connected | Connect explanation + **Connect to Google** |
| Connected, no pull yet | **Pull Google reviews** |
| Pull succeeded | Imported count + Pull again (refresh) |
| Pull failed | Error under the button (quota, no listing, Google error) |

Google rows in the inbox have `source: 'google'`. They are excluded from **Needs reply** and have no reply UI.

---

## Public profile

| Surface | Behavior |
| ------- | -------- |
| Header stars | ServiceLink `reviews` only. Google does not change the average. |
| Reviews tab | Shown if ServiceLink **or** imported Google count > 0 (`publicGoogleReviewCount`). |
| Tab list | ServiceLink reviews + `googleReviews` / `googleSummary` as a separate list. Cards show a **Google** label. Star-only Google reviews omit an empty body. |

SSR summary stays ServiceLink-only. Google count is loaded separately so the tab can appear when only Google reviews exist.

---

## APIs

Routes live in `src/constants/routes.ts`. Do not hardcode paths.

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| `POST` | `/api/reviews/google/connect` | Owner | Start OAuth. Returns `{ url }` to Google. |
| `GET` | `/api/reviews/google/callback` | Owner + signed `state` | Exchange code, save tokens, try listing lookup, redirect to Reviews. |
| `GET` | `/api/reviews/google/status` | Owner | `{ connected }` only. Tokens never leave the server. |
| `POST` | `/api/reviews/google/sync` | Owner | Find listing and save account/location names. Used by pull; not shown in the UI. |
| `POST` | `/api/reviews/google/pull` | Owner | Sync listing, page all Google reviews, upsert `google_reviews`. Returns `{ importedCount }`. |

**Also merged into existing routes**

| Method | Route | Change |
| ------ | ----- | ------ |
| `GET` | `/api/reviews` | ServiceLink inbox + Google rows, newest first. |
| `GET` | `/api/public/profile/[slug]/reviews` | Adds `googleReviews` and `googleSummary`. Does not mix averages. |

---

## Server modules

`src/features/reviews/google-connect/server/`

| Module | Role |
| ------ | ---- |
| `googleBusinessOAuth.ts` | Client env, redirect URI, authorize URL, `business.manage` scope |
| `googleConnectState.ts` | Signed OAuth state (`businessId`, `userId`, expiry) |
| `startGoogleBusinessConnect.ts` | Build authorize URL + httpOnly nonce cookie `sl_gbp_oauth` |
| `exchangeGoogleBusinessCode.ts` | Auth code → tokens |
| `refreshGoogleAccessToken.ts` | Refresh when access token is expired |
| `getGoogleAccessTokenForBusiness.ts` | Load connection, refresh if needed |
| `fetchGoogleBusinessLocations.ts` | Accounts + locations; first location wins |
| `upsertGoogleBusinessConnection.ts` | One row per `business_id` |
| `syncGoogleBusinessListing.ts` | Token → location pick → save names |
| `pullGoogleBusinessReviews.ts` | Sync, then `GET …/v4/{parent}/reviews` (page size 50) |
| `googleReviewsParentName.ts` | `accounts/…/locations/…` parent path |
| `googleReviewStarRating.ts` | `ONE`–`FIVE` → 1–5 |
| `mapGoogleReviewToPublic.ts` | Google API row → DB + public card |
| `loadGoogleBusinessConnectionStatus.ts` | Connected? (no tokens) |
| `loadGoogleReviews.ts` | Public + dashboard reads from `google_reviews` |

---

## Connect sequence

```mermaid
sequenceDiagram
  participant Owner
  participant App
  participant Google
  participant DB

  Owner->>App: Connect to Google
  App->>App: Sign state with businessId + userId
  App->>Google: Authorize business.manage offline
  Google->>App: GET /api/reviews/google/callback?code&state
  App->>Google: Exchange code
  App->>Google: List accounts and locations
  App->>DB: Upsert google_business_connections
  App->>Owner: Redirect /dashboard/reviews?google=connected

  Owner->>App: Pull Google reviews
  App->>Google: Find listing again
  App->>Google: Page reviews.list
  App->>DB: Upsert google_reviews
  App->>Owner: importedCount
```

OAuth: `access_type=offline`, `prompt=consent`, scope `https://www.googleapis.com/auth/business.manage`.

Redirect URIs must match the Cloud client exactly:

- `http://localhost:3000/api/reviews/google/callback`
- `https://myservicelink.app/api/reviews/google/callback`

---

## Google Cloud setup

This is **not** Login with Google (Supabase Auth). Use a separate OAuth web client.

**Env (server only)**

- `GOOGLE_BUSINESS_CLIENT_ID`
- `GOOGLE_BUSINESS_CLIENT_SECRET`

Restart `next dev` after changing `.env.local`.

**APIs to enable** on the ServiceLink Cloud project:

1. My Business Account Management API
2. My Business Business Information API
3. Google My Business API (v4 reviews) — may stay hidden until Google approves the project

**Quota gate:** this is **API allowlist access**, not a quota-increase ticket. New projects start at **Requests per minute = 0**. Connect can still store tokens. Pull and listing lookup return **429** until Google approves Basic API Access (typically **300**). Check **APIs & Services → My Business Account Management API → Quotas**, not the traffic graph, and not **IAM → Quotas** (that list is every API in the project).

Do **not** use **Edit Quotas** on that row. Apply at the [GBP API contact form](https://support.google.com/business/contact/api_default) → **Application for Basic API Access**. The form wants a **verified listing live 60+ days** and the Cloud **project number** (digits), not the project id string (`servicelink-488502`).

When quota is live: Reviews → **Pull Google reviews**. Confirm rows in the inbox (Google label) and the public Reviews tab. See **Parked — read this next time** at the top for the current case id.

---

## Database

Do **not** insert Google reviews into `reviews`. That table is invite/booking-backed.

Migrations (run in order after the native review migrations):

| File | Table |
| ---- | ----- |
| [`migrations/004_google_business_connections.sql`](./migrations/004_google_business_connections.sql) | `google_business_connections` |
| [`migrations/005_google_reviews.sql`](./migrations/005_google_reviews.sql) | `google_reviews` |

Both tables: RLS on, **service role only**. Tokens never go to `anon` / `authenticated`.

### `google_business_connections`

One row per ServiceLink business.

| Column | Notes |
| ------ | ----- |
| `business_id` | Unique FK → `business_profiles` |
| `google_account_name` | e.g. `accounts/123` |
| `google_location_name` | e.g. `locations/456` |
| `google_location_title` | Display title from Google |
| `refresh_token` | Required; server only |
| `access_token` / `access_token_expires_at` | Refreshed as needed |
| `scopes` | Default `business.manage` |
| `last_synced_at` | Set after a successful pull |

### `google_reviews`

| Column | Notes |
| ------ | ----- |
| `business_id` | FK → `business_profiles` |
| `provider_review_id` | Google review id; unique with `business_id` |
| `rating` | 1–5 |
| `body` | Empty string allowed (star-only) |
| `author_display_name` / `author_photo_url` / `is_anonymous` | From Google reviewer |
| `provider_create_time` / `provider_update_time` | Google timestamps |
| `owner_reply_body` / `owner_replied_at` | Copied from Google if present. Read-only in ServiceLink. |

Pull upserts on `(business_id, provider_review_id)`. Re-pull refreshes existing rows.

---

## Display types

`PublicProfileReview.source`: `'servicelink'` | `'google'`.

Google public ids are `google:{providerReviewId}` (import) or `google:{row.id}` (load). Dashboard Google rows set `isHidden: false` (no hide UI yet).

```ts
{
  reviews: PublicProfileReview[];       // ServiceLink
  summary: PublicProfileReviewsSummary; // ServiceLink only
  googleReviews?: PublicProfileReview[];
  googleSummary?: PublicProfileReviewsSummary | null;
}
```

---

## Not built yet

- Disconnect / revoke
- Multi-listing picker
- Scheduled / cron pull
- Reply or hide Google reviews from ServiceLink
- Mixing Google stars into the public header average

---

## Code map

| Path | Role |
| ---- | ---- |
| `src/features/reviews/google-connect/` | OAuth, sync, pull, mappers, tests |
| `src/app/api/reviews/google/*` | Connect, callback, status, sync, pull |
| `src/features/reviews/dashboard/components/cards/ReviewsGoogleConnectCard.tsx` | Owner card |
| `src/features/business-profile/reviews/` | Public cards + lazy tab |
