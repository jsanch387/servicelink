# Marketplace Listing Eligibility Checklist

Status: Partially shipped (V1 live behind `MARKETPLACE_PUBLIC_ENABLED`)  
Last updated: July 22, 2026

**Canonical feature docs:** `src/features/marketplace/docs/`  
(FLOWS + SEARCH_AND_DATA). Prefer those for how search works today.

**Related:** Service area collection — `docs/service-area-collection.md`.

## Goal

Define who can appear in customer search (`/find-detailers`). Keep V1 light and trustworthy.

## V1 listing rule (shipped)

A business may appear in marketplace search when **all** of the following are true:

1. **Has an account** — owned `business_profiles` row linked to an auth user.
2. **Pro / paid** — current Pro entitlement (`isProAccess`).
3. **Public profile live** — `isPublicBusinessProfileLive` rules pass.
4. **At least one active service** — bookable service exists.
5. **Location match** — primary `business_service_areas` within radius **or** legacy `service_area` / ZIP text match.
6. **Not denylisted** — owner Auth email not in `marketplaceListingDenylist`.

**Not required in shipped V1:** marketplace opt-in toggle. Eligible Pros are auto-included.

If any check fails → hide from search.

## Verified badge (deferred)

Do **not** invent a separate “Verified” badge for V1.

Recommended later:

| Signal                 | Meaning                         | When to show                    |
| ---------------------- | ------------------------------- | ------------------------------- |
| Pro                    | Paying / serious operator       | While Pro entitlement is active |
| Service area confirmed | Location + radius saved         | After service area exists       |
| Active                 | Recent bookings or recent login | Optional later anti-ghost rule  |

V1 trust:

- Only Pro businesses are eligible to list
- Rating + review count on cards when available
- No fake “Verified” checkmark until the rules above are productized
- No Pro badge on marketplace cards (all listed are Pro)

Open question: should Free users ever list? Default for launch: **No — Pro only**.

## Account / activity checklist

### Required for listing (shipped V1)

- [x] Auth account exists
- [x] Business profile exists
- [x] Pro entitlement active
- [x] Public booking profile is live
- [x] Location match (BSA radius and/or legacy text)
- [ ] Marketplace opt-in enabled ← **deferred**; auto-include for now
- [x] ≥ 1 active service
- [x] Manual denylist for test accounts

### Nice-to-have later (not blockers)

- [ ] Logo uploaded
- [ ] Photos uploaded
- [ ] Reviews exist
- [ ] Recent activity (booking or login within N days)
- [ ] Response-time / availability signal

## How someone gets listed (product flow)

1. Sign up / log in
2. Complete required service area (city/state + radius) — web + mobile (recommended; legacy text still works)
3. Keep Pro active + public profile live + ≥ 1 service
4. ~~Enable marketplace listing~~ — **not yet**; Pros appear automatically when matching
5. Appear in `/find-detailers` for customers in range (or legacy city text)

Future: keep location collection and listing opt-in separate when opt-in ships.

## Anti-spam / quality notes

- Rate-limit public search (in place)
- Prefer Pro-only listing for launch quality
- Manual Auth-email denylist for test/sandbox businesses
- Later: pause listings with no activity for 60–90 days and ask for reconfirm
- Never expose private mobile home coordinates in public APIs

## Implementation notes (future opt-in)

- Add boolean on business profile or listings table, e.g. `marketplace_listed_at`
- Search API filters: Pro + live + location + **opt-in**
- Dashboard copy: “Show me to nearby customers”
- No badge UI until eligibility rules are live and stable
