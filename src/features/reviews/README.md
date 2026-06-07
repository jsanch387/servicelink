# Reviews feature

Owner dashboard inbox, public profile display, and customer submit via **email invite** after a completed booking. No owner-shareable review URL.

## Start here

| Doc                                    | Contents                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| **[docs/FLOWS.md](./docs/FLOWS.md)**   | **End-to-end flows** — product rules, identity, APIs, UI, data shapes |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema, lifecycle, RLS, tokens, SQL                                   |
| [docs/SERVER.md](./docs/SERVER.md)     | Server modules and loading strategy                                   |
| [docs/README.md](./docs/README.md)     | Full documentation index                                              |

## Folder layout

```
reviews/
  index.ts
  README.md
  docs/                    # Feature + database reference
  server/                  # Invites, submit, public loaders
  dashboard/               # /dashboard/reviews UI + APIs
  public/                  # /review/[token] customer UI
  types/                   # Shared TS types
  utils/
```

Public profile UI lives in `src/features/business-profile/reviews/`.  
Review invite email lives in `src/features/email/review-invite/`.

## Implementation status

| Piece                                   | Status                                        |
| --------------------------------------- | --------------------------------------------- |
| `review_invites` + `reviews` tables     | Required in Supabase (see `docs/DATABASE.md`) |
| Mark complete → review invite email     | Wired                                         |
| Customer `/review/[token]` + submit API | Wired                                         |
| Owner dashboard inbox + reply           | Wired                                         |
| Public profile reviews tab (lazy load)  | Wired                                         |
| Booking list: invite eligibility flags  | Wired                                         |
| Complete appointment confirmation modal | Wired                                         |
| Owner resend invite                     | Not built                                     |
| SMS invites                             | Not built                                     |
| Receipt on complete                     | Not built                                     |
| Dashboard hide-review UI                | Not built                                     |

## Product policy (short)

- Invites emailed after **completed** bookings only.
- **One review per customer** per business (`customer_id`).
- Link valid **90 days**, **one-time use**.
- Public profile shows non-hidden reviews only.
- No owner copy/share review link.
