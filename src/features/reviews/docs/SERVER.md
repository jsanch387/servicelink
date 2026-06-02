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

**Owner dashboard (wired):**

| Piece | Path |
|-------|------|
| `loadDashboardReviews` | `dashboard/server/loadDashboardReviews.ts` — all reviews for business (incl. hidden) |
| `mapReviewRowToDashboardReview` | `dashboard/server/mapReviewRowToDashboardReview.ts` |
| `GET /api/reviews` | `app/api/reviews/route.ts` |
| `useDashboardReviews` | `dashboard/hooks/useDashboardReviews.ts` |

**Booking complete + public submit (wired):**

| Piece | Path |
|-------|------|
| `createReviewInviteIfEligible` | `server/createReviewInviteIfEligible.ts` — invite row + review email |
| `applyReviewInviteOnBookingCompleted` | `server/applyReviewInviteOnBookingCompleted.ts` — called from `PATCH /api/availability/bookings/[id]` |
| Review invite email | `features/email/review-invite/` |
| `loadPublicReviewInviteByToken` | `server/loadPublicReviewInviteByToken.ts` |
| `submitPublicReview` | `server/submitPublicReview.ts` |
| `POST /api/public/reviews/submit` | `app/api/public/reviews/submit/route.ts` |
| `app/review/[token]/page.tsx` | Customer review form + success/error states |

**Not built yet:**

| Planned | Pattern |
|---------|---------|
| `is_hidden` toggle on dashboard | `PATCH /api/reviews/[id]` extension |
| Receipt / invoice on complete | Combined or separate email (deferred) |

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

`ReviewsDashboardPage` loads via `useDashboardReviews` → `GET /api/reviews` → `loadDashboardReviews` (authenticated Supabase + RLS). Replies persist via `PATCH /api/reviews/[id]` with `{ ownerReplyBody: "..." }` or `{ ownerReplyBody: null }` to clear (both DB columns nulled).
