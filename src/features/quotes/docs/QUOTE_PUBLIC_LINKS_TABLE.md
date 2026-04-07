# Quote public links table

This doc describes the **`quote_public_links`** table used for secure customer-facing quote URLs (view/approve/decline), including schema, indexes, RLS, and operational considerations.

Scope here is the link table only (quote lifecycle itself is documented in `QUOTES_TABLE.md`).

---

## Purpose

`quote_public_links` provides tokenized, expirable, revocable links so customers can open and respond to a quote without exposing raw quote IDs.

Design goals:

- Keep public access secure (token hash storage, not raw token).
- Support one active link per quote (current policy).
- Track link usage (view counters/timestamps).
- Track customer response metadata at link level if needed.

---

## Relationship model

- `quote_public_links.quote_id -> quotes.id ON DELETE CASCADE`
- If a quote is deleted, all related public links are deleted automatically.

---

## Schema summary

Table: `public.quote_public_links`

| Column | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | no | PK, default `gen_random_uuid()` |
| `quote_id` | uuid | no | FK -> `quotes(id)` `ON DELETE CASCADE` |
| `token_hash` | text | no | Hashed token (never store raw token) |
| `is_active` | boolean | no | Default `true` |
| `expires_at` | timestamptz | no | Link expiry |
| `revoked_at` | timestamptz | yes | Set when revoked |
| `revoked_reason` | text | yes | Optional reason |
| `view_count` | integer | no | Default `0`, non-negative |
| `first_viewed_at` | timestamptz | yes | First open timestamp |
| `last_viewed_at` | timestamptz | yes | Most recent open timestamp |
| `response_status` | text | yes | `approved` or `declined` |
| `responded_at` | timestamptz | yes | Set when response recorded |
| `created_at` | timestamptz | no | Default `now()` |
| `updated_at` | timestamptz | no | Default `now()`, trigger-maintained |

---

## Constraints

- `view_count >= 0`
- revoked consistency:
  - active + no revoke timestamp, or
  - inactive + revoke timestamp present
- response consistency:
  - both `response_status` and `responded_at` null, or both present
- response status allowed values: `approved`, `declined`

---

## Uniqueness and active-link policy

Recommended unique indexes:

- `unique(token_hash)`
- `unique(quote_id) where is_active = true`

This enforces a **single active link per quote** (recommended for predictable UX and easier invalidation).

If product needs multiple active links, remove/adjust that partial unique index.

---

## Indexes (performance)

Recommended:

- `(quote_id, created_at desc)` for owner/history lookups
- `(expires_at)` for expiry cleanup jobs
- `(is_active, expires_at)` for validity checks
- `unique(token_hash)` for fast token resolution

---

## RLS model (owner scope)

RLS enabled on `public.quote_public_links`.

Authenticated owner policies:

- **SELECT / INSERT / UPDATE / DELETE** allowed only if link’s quote belongs to a business owned by `auth.uid()` via `business_profiles.profile_id`.

No direct public/anon row access is needed for token flows; public endpoints should resolve tokens server-side.

---

## Security considerations

- Generate raw token in backend only.
- Store only hash (`token_hash`) in DB.
- Resolve public link by hashing incoming token and matching hash.
- Validate all of:
  - `is_active = true`
  - `revoked_at is null`
  - `expires_at > now()`
- Use strong random token entropy.

---

## Runtime behavior guidance

- On send:
  1. revoke/deactivate prior active link for quote (if single-link policy)
  2. create new link row with fresh token hash and expiry
- On view:
  - increment `view_count`
  - set `first_viewed_at` if null
  - update `last_viewed_at`
- On response:
  - set `response_status` + `responded_at`
  - optionally revoke link after response (product decision)

---

## Suggested maintenance tasks

- Scheduled job to mark old active links expired/revoked.
- Optional archival strategy for very old links.
- Monitoring for unusual view spikes (abuse detection).

---

## Related docs

- `src/features/quotes/docs/QUOTES_TABLE.md`

