# Reviews — documentation index

Database and product reference for the reviews feature. Start here when wiring APIs or regenerating types.

## Database (Supabase)

| Doc | When to read |
|-----|----------------|
| **[DATABASE.md](./DATABASE.md)** | **Start here** — ER diagram, lifecycle, RLS, tokens, queries, UI mapping |
| [REVIEW_INVITES_TABLE.md](./REVIEW_INVITES_TABLE.md) | `review_invites` column reference |
| [REVIEWS_TABLE.md](./REVIEWS_TABLE.md) | `reviews` column reference |
| [migrations/001_review_invites.sql](./migrations/001_review_invites.sql) | SQL migration (table 1) |
| [migrations/002_reviews.sql](./migrations/002_reviews.sql) | SQL migration (table 2) |
| [migrations/003_one_review_per_customer.sql](./migrations/003_one_review_per_customer.sql) | Per-customer unique indexes |

## App code

| Path | Role |
|------|------|
| `../dashboard/` | Owner inbox UI (`/dashboard/reviews`) |
| `../../business-profile/reviews/` | Public profile Reviews tab |
| `../README.md` | Feature status and product policy |

## Product policy (short)

- Invites emailed after **completed** bookings — no owner copy/share review link.
- One review per customer per business (repeat visits do not add another public review).
- Public profile shows non-hidden `reviews` only.
