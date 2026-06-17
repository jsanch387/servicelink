# Reviews — server layer

How review data is loaded today and where API routes will live.

## Layout

| Path                                             | Role                                                           |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `server/loadPublicReviewSummary.ts`              | SSR: ratings only → header + tab visibility                    |
| `server/loadPublicBusinessReviews.ts`            | Full reviews (API on tab click)                                |
| `app/api/public/profile/[slug]/reviews/route.ts` | `GET` — lazy tab fetch                                         |
| `server/mapReviewRowToPublicProfile.ts`          | DB row → `PublicProfileReview` (+ safe `tryMap*`)              |
| `server/computeRatingBreakdown.ts`               | Star breakdown percents                                        |
| `utils/deriveReviewsSummary.ts`                  | Average + breakdown from review list                           |
| `types/loadResults.ts`                           | `LoadPublicBusinessReviewsResult` (`ok` \| `empty` \| `error`) |

**Owner dashboard (wired):**

| Piece                           | Path                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `loadDashboardReviews`          | `dashboard/server/loadDashboardReviews.ts` — all reviews for business (incl. hidden) |
| `mapReviewRowToDashboardReview` | `dashboard/server/mapReviewRowToDashboardReview.ts`                                  |
| `GET /api/reviews`              | `app/api/reviews/route.ts`                                                           |
| `useDashboardReviews`           | `dashboard/hooks/useDashboardReviews.ts`                                             |

**Booking complete + public submit (wired):**

| Piece                                 | Path                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `createReviewInviteIfEligible`        | `server/createReviewInviteIfEligible.ts` — invite row + delivery (SMS-first, email fallback)                                        |
| `applyReviewInviteOnBookingCompleted` | `server/applyReviewInviteOnBookingCompleted.ts` — called from `completeBookingWithSideEffects` (web PATCH + mobile `job_completed`) |
| Review invite SMS                     | `features/sms/messages/bookingSms.ts` (`buildReviewRequestSms`)                                                                     |
| Review invite email (fallback)        | `features/email/review-invite/`                                                                                                     |
| `loadPublicReviewInviteByToken`       | `server/loadPublicReviewInviteByToken.ts`                                                                                           |
| `submitPublicReview`                  | `server/submitPublicReview.ts`                                                                                                      |
| `POST /api/public/reviews/submit`     | `app/api/public/reviews/submit/route.ts`                                                                                            |
| `app/review/[token]/page.tsx`         | Customer review form + success/error states                                                                                         |

**Not built yet:**

| Planned                         | Notes                                   |
| ------------------------------- | --------------------------------------- |
| Owner resend invite             | —                                       |
| Dashboard hide-review UI        | `PATCH` may support `is_hidden`; UI TBD |
| Receipt / invoice on complete   | —                                       |
| Owner resend invite (SMS/email) | —                                       |

See [FLOWS.md](./FLOWS.md) for full E2E reference. Pattern for similar features: `src/features/quotes/dashboard/server/`.

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
