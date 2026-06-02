# Reviews — documentation index

Start with **[FLOWS.md](./FLOWS.md)** for how the feature works end-to-end. Use the database docs when writing SQL, migrations, or RLS.

## Product & architecture

| Doc | When to read |
|-----|----------------|
| **[FLOWS.md](./FLOWS.md)** | **Start here** — E2E flows, APIs, UI, types, what each loader SELECTs |
| [SERVER.md](./SERVER.md) | Server module map, lazy-load strategy, error handling |
| [DATABASE.md](./DATABASE.md) | ER diagram, lifecycle, RLS, tokens, example queries |

## Database tables

| Doc | When to read |
|-----|----------------|
| [REVIEW_INVITES_TABLE.md](./REVIEW_INVITES_TABLE.md) | `review_invites` column reference |
| [REVIEWS_TABLE.md](./REVIEWS_TABLE.md) | `reviews` column reference |

Migration SQL is referenced in DATABASE.md; run migrations in Supabase in order (`review_invites` → `reviews` → per-customer unique indexes).

## App code

| Path | Role |
|------|------|
| `../dashboard/` | Owner inbox (`/dashboard/reviews`) |
| `../public/` | Customer review page (`/review/[token]`) |
| `../../business-profile/reviews/` | Public profile Reviews tab |
| `../../email/review-invite/` | Transactional invite email |
| `../README.md` | Feature README + status |

## Product policy (short)

- Invites after **completed** bookings — no owner share link.
- **One review per customer** per business (`customer_id` from CRM dedupe at booking).
- Links expire in **90 days**; single submit per link.
- Public profile: `is_hidden = false` only.
