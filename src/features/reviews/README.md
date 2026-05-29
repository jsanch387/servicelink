# Reviews feature

Owner dashboard inbox + shared types/mocks. Public profile display lives in `business-profile/reviews/`.

## Product policy: no shareable review link

Owners cannot copy or share a “leave a review” URL. Invites are emailed (SMS later) after a completed booking with a one-time token (`/review/{token}` — not built yet).

## Folder layout

```
reviews/
  index.ts                 # App-facing exports
  README.md
  dashboard/
    types.ts
    constants/             # Mock inbox data until API
    utils/                 # Filter helpers
    components/
      ReviewsDashboardPage.tsx
      ReviewDetailPage.tsx
      ReviewsDashboardShell.tsx
      ReviewsDashboardHeader.tsx
      cards/               # Summary + “how reviews work”
      list/                # Rows, filters, empty state, skeleton, reply UI
```

## Implementation status

| Piece | Status |
|--------|--------|
| Dashboard + profile UI (mock) | Done |
| `review_invites` + `reviews` tables | Not started |
| `GET /review/[token]` + submit API | Not started |
| Email on booking complete | Not started |
