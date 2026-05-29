# Reviews — database reference

Human-readable schema and behavior for **`review_invites`** and **`reviews`**. Use this for implementation, AI context, and onboarding.

- **Migrations (run in order):** [`migrations/001_review_invites.sql`](./migrations/001_review_invites.sql) → [`migrations/002_reviews.sql`](./migrations/002_reviews.sql)
- **Per-table detail:** [`REVIEW_INVITES_TABLE.md`](./REVIEW_INVITES_TABLE.md), [`REVIEWS_TABLE.md`](./REVIEWS_TABLE.md)

---

## Product rules (data model implications)

| Rule | How the DB enforces it |
|------|-------------------------|
| One review per completed visit | `review_invites.booking_id` unique; `reviews.booking_id` unique |
| No owner-shareable review URL | Only `link_token_hash` stored; raw token never in DB |
| Customer submits via email link only | Invite row + token hash; no open form on `/{slug}` |
| Owner cannot edit customer text (v1) | No owner `UPDATE` on `rating` / `body` in API (RLS allows update — restrict in app) |
| Hide from public, keep in inbox | `reviews.is_hidden = true` |

---

## Tables at a glance

| Table | Role | Created by |
|-------|------|------------|
| `review_invites` | One-time magic link per booking; email + expiry | Service role when booking marked **completed** |
| `reviews` | Stars + comment + optional owner reply | Service role when customer **submits** form |

Both tables scope to **`business_profiles`** via `business_id` and tie to **`bookings`**.

---

## Relationship diagram

```mermaid
erDiagram
  business_profiles ||--o{ review_invites : has
  business_profiles ||--o{ reviews : has
  bookings ||--o| review_invites : "one invite"
  bookings ||--o| reviews : "one review"
  review_invites ||--o| reviews : "one review"
  customers ||--o{ review_invites : optional
  customers ||--o{ reviews : optional

  business_profiles {
    uuid id PK
    uuid profile_id FK
    text business_slug
  }

  bookings {
    uuid id PK
    uuid business_id FK
    text status
    text customer_name
    text customer_email
  }

  review_invites {
    uuid id PK
    uuid business_id FK
    uuid booking_id FK UK
    text link_token_hash UK
    text status
    timestamptz expires_at
  }

  reviews {
    uuid id PK
    uuid business_id FK
    uuid booking_id FK UK
    uuid review_invite_id FK UK
    smallint rating
    text body
    boolean is_hidden
  }
```

**Cascade deletes:** Deleting a `business_profiles` or `bookings` row removes related invites and reviews.

---

## End-to-end lifecycle

```text
1. Owner marks booking status = completed (API)
        ↓
2. INSERT review_invites (service role)
   - Generate raw token (server only)
   - Store SHA-256 hex as link_token_hash
   - status = pending, expires_at = now + 90d (app default)
   - Email customer: https://{site}/review/{rawToken}
        ↓
3. Customer opens /review/{token}
   - Server hashes token → lookup review_invites
   - Valid if: status = pending AND expires_at > now()
        ↓
4. Customer submits rating + body (POST, service role)
   - INSERT reviews (rating, body, author_display_name snapshot, …)
   - UPDATE review_invites SET status = submitted, submitted_at = now()
        ↓
5. Owner dashboard / public profile
   - Dashboard: SELECT reviews (all, including hidden) + UPDATE reply / is_hidden
   - Public profile: SELECT reviews WHERE is_hidden = false (service role in page/API)
```

**Terminal invite states**

| `review_invites.status` | Meaning |
|-------------------------|---------|
| `pending` | Link valid (if not expired); no review row yet |
| `submitted` | Customer submitted; `submitted_at` set; `reviews` row exists |
| `expired` | Past `expires_at` or set by job/app |
| `cancelled` | Voided without submit (rare; app-defined) |

---

## Token security

Same pattern as **`quote_public_links`** and **`maintenance_enrollments`**:

| Layer | Value |
|-------|--------|
| Email / SMS URL | Raw token in path: `/review/{rawToken}` |
| Database | `link_token_hash` only (64-char lowercase hex) |
| Resolver | `resolveQuoteTokenHash(raw)` in `src/features/quotes/shared/utils/resolveQuoteTokenHash.ts` |

**Do not** store raw tokens in `review_invites`. **Do not** log raw tokens in production.

---

## Row Level Security (summary)

| Table | `authenticated` (owner) | `anon` | `service_role` |
|-------|-------------------------|--------|----------------|
| `review_invites` | SELECT | — | ALL (create invite, token lookup, mark submitted) |
| `reviews` | SELECT, UPDATE | — | ALL (insert on submit, public profile read) |

Owner scope for both:

```sql
exists (
  select 1 from public.business_profiles bp
  where bp.id = <table>.business_id
    and bp.profile_id = auth.uid()
)
```

**No INSERT/UPDATE policies** on `review_invites` for owners — invites are system-created.

**No DELETE policies** on `reviews` in v1 — use `is_hidden`.

---

## Triggers & integrity

| Trigger | Table | Purpose |
|---------|-------|---------|
| `trg_review_invites_booking_business` | `review_invites` | `booking_id` must belong to `business_id` |
| `trg_review_invites_set_updated_at` | `review_invites` | `updated_at = now()` on update |
| `trg_reviews_enforce_relationships` | `reviews` | `review_invite_id` matches `business_id` + `booking_id`; booking matches business |
| `trg_reviews_set_updated_at` | `reviews` | `updated_at = now()` on update |

Requires existing function **`public.set_updated_at()`** (used by quotes).

---

## Indexes (why they exist)

**`review_invites`**

| Index | Use |
|-------|-----|
| `review_invites_booking_id_key` (unique) | One invite per booking |
| `review_invites_link_token_hash_key` (unique) | Public token lookup |
| `review_invites_business_id_created_at_idx` | Owner/debug lists |
| `review_invites_expires_at_idx` (partial, `pending`) | Expiry cleanup jobs |

**`reviews`**

| Index | Use |
|-------|-----|
| `reviews_booking_id_key` (unique) | One review per visit |
| `reviews_review_invite_id_key` (unique) | Join invite → review |
| `reviews_business_id_created_at_idx` | Dashboard inbox (newest first) |
| `reviews_business_id_public_idx` (partial, `is_hidden = false`) | Public profile tab + aggregates |

---

## DB columns ↔ app types

Dashboard mock/UI (`src/features/reviews/dashboard/types.ts`) maps to SQL as follows:

| UI / TypeScript | Database column | Notes |
|-----------------|-----------------|-------|
| `id` | `reviews.id` | |
| `authorDisplayName` | `reviews.author_display_name` | Set at submit from booking/customer |
| `rating` | `reviews.rating` | `smallint` 1–5 |
| `body` | `reviews.body` | Max 2000 chars |
| `createdAt` | `reviews.created_at` | ISO string in API |
| `ownerReply.body` | `reviews.owner_reply_body` | Max 1000 chars |
| `ownerReply.repliedAt` | `reviews.owner_replied_at` | |

Invite fields used server-side only (not in current dashboard mock):

| Database column | Typical use |
|-----------------|-------------|
| `link_token_hash` | Resolve `/review/[token]` |
| `email_sent_at` | Whether invite email succeeded |
| `last_notification_error` | Resend / support debugging |
| `expires_at` | Reject stale links |

---

## Suggested queries (implementation)

**Owner inbox (newest first)**

```sql
select *
from public.reviews
where business_id = $1
order by created_at desc;
```

**Public profile (visible only)**

```sql
select id, author_display_name, rating, body, created_at,
       owner_reply_body, owner_replied_at
from public.reviews
where business_id = $1
  and is_hidden = false
order by created_at desc
limit 50; -- product limit TBD
```

**Resolve invite from URL token**

```sql
select *
from public.review_invites
where link_token_hash = $1
  and status = 'pending'
  and expires_at > now();
```

**Aggregate rating (public)**

```sql
select count(*)::int as review_count,
       round(avg(rating)::numeric, 1) as average_rating
from public.reviews
where business_id = $1
  and is_hidden = false;
```

---

## UI surfaces that consume this data

| Surface | Data source | Filter |
|---------|-------------|--------|
| `/dashboard/reviews` | `reviews` | All rows for business; client filters needs reply |
| Public profile Reviews tab | `reviews` | `is_hidden = false` |
| Profile header rating | `reviews` aggregate | `is_hidden = false` |
| `/review/[token]` form | `review_invites` + booking snapshot | Valid pending invite |

Code (UI only today; mocks until API wired):

- Owner: `src/features/reviews/dashboard/`
- Public: `src/features/business-profile/reviews/`

---

## Related platform tables

| Table | Relationship |
|-------|----------------|
| `bookings` | Invite created when `status` → `completed`; customer name/email snapshots for invite email |
| `customers` | Optional `customer_id` on both tables for CRM joins |
| `business_profiles` | Tenancy root; `profile_id = auth.uid()` for RLS |

Comparable patterns elsewhere:

- `quote_public_links` — hashed token, no anon RLS
- `maintenance_enrollments.customer_link_token_hash` — hashed customer link

---

## Not in v1 (document for later)

- SMS invite (`text message coming soon` in UI copy)
- Owner “resend invite” / manual invite without copy URL
- `DELETE` on reviews (moderation = `is_hidden`)
- Trust scoring (exclude manual bookings from average)
- Regenerate Supabase `Database` types after migrations (`review_invites` / `reviews` may use service client + typed helpers initially)

---

## Doc index

| File | Contents |
|------|----------|
| [DATABASE.md](./DATABASE.md) | This file — overview, flows, RLS, queries |
| [REVIEW_INVITES_TABLE.md](./REVIEW_INVITES_TABLE.md) | `review_invites` columns & constraints |
| [REVIEWS_TABLE.md](./REVIEWS_TABLE.md) | `reviews` columns & owner update rules |
| [../README.md](../README.md) | Feature folder + implementation status |
