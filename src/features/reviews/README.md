# Reviews feature

Owner dashboard inbox + public profile display. Customer submits via **email invite** after a completed booking (no shareable review URL).

## Documentation

| Doc | Contents |
|-----|----------|
| **[docs/DATABASE.md](./docs/DATABASE.md)** | **Database reference** — tables, lifecycle, RLS, tokens, queries |
| [docs/README.md](./docs/README.md) | Doc index |
| [docs/REVIEW_INVITES_TABLE.md](./docs/REVIEW_INVITES_TABLE.md) | `review_invites` columns |
| [docs/REVIEWS_TABLE.md](./docs/REVIEWS_TABLE.md) | `reviews` columns |

## Folder layout

```
reviews/
  index.ts
  README.md
  docs/                    # Database & migrations
  dashboard/               # /dashboard/reviews UI
```

Public profile UI: `src/features/business-profile/reviews/`

## Implementation status

| Piece | Status |
|--------|--------|
| Dashboard + profile UI (mock data) | Done |
| `review_invites` + `reviews` in Supabase | Run `docs/migrations/003_one_review_per_customer.sql` after base tables |
| Database documentation | `docs/DATABASE.md` |
| `GET /review/[token]` + submit API | Wired |
| Review email on booking complete | Wired (`PATCH` availability booking) |
| Email on booking complete | Not started |
| Wire dashboard + profile to DB | Not started |

## Product policy

- No owner copy/share review link.
- **One review per customer** on the public profile (invite still tied to a completed visit).
- Invites: email now, SMS later.
