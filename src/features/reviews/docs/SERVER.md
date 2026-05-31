# Reviews — server layer

How review data is loaded today and where API routes will live.

## Layout

| Path | Role |
|------|------|
| `server/loadPublicReviewSummary.ts` | SSR: ratings only → header + tab visibility |
| `server/loadPublicBusinessReviews.ts` | Full reviews (API on tab click) |
| `app/api/public/profile/[slug]/reviews/route.ts` | `GET` — lazy tab fetch |
| `server/mapReviewRowToPublicProfile.ts` | DB row → `PublicProfileReview` (+ safe `tryMap*`) |
| `server/computeRatingBreakdown.ts` | Star breakdown percents |
| `utils/deriveReviewsSummary.ts` | Average + breakdown from review list |
| `types/loadResults.ts` | `LoadPublicBusinessReviewsResult` (`ok` \| `empty` \| `error`) |

**Not built yet (follow quotes pattern):**

| Planned | Pattern |
|---------|---------|
| `dashboard/server/loadDashboardReviews.ts` | `resolveCurrentBusinessId` + scoped query |
| `app/api/reviews/route.ts` | GET list, PATCH hide/reply |
| `app/api/public/reviews/submit/route.ts` | Service role, invite token |
| `server/createReviewInviteIfEligible.ts` | Booking-complete hook |

See `src/features/quotes/dashboard/server/` and `src/app/api/quotes/` for reference.

## Public profile loading strategy

1. **Initial page (SSR):** `loadPublicReviewSummary` — selects `rating` only (cheap). Powers header star + Reviews tab visibility.
2. **Reviews tab (client):** `LazyPublicReviewsSection` → `GET /api/public/profile/[slug]/reviews` → `loadPublicBusinessReviews` (full bodies, replies, breakdown).
3. Fetched once per visit while the tab stays mounted; retry on error.

## Public profile error handling

1. Both loaders return **discriminated results** — never throw to the page.
2. Query errors → `{ status: 'error', message }` + `console.error`.
3. `publicReviewSummaryFromLoadResult` / `publicReviewsDataFromLoadResult` map `empty` and `error` to `null` for SSR (optional module).
4. Full list: malformed rows skipped via `tryMapReviewRowToPublicProfile`; tab shows localized error + retry.

Wired in `src/app/[business-slug]/page.tsx` via admin Supabase client.

## Dashboard today

`src/app/dashboard/reviews/page.tsx` only checks auth + onboarding. **`ReviewsDashboardPage` is client-only with an empty list** until `GET /api/reviews` and `loadDashboardReviews` are added. Use the same `{ ok, error, status }` result shape as quotes when implementing.
