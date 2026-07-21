# Marketplace Listing Eligibility Checklist

Status: Spec only (no UI yet)  
Last updated: July 20, 2026

## Goal

Define who can appear in customer search (`/find-detailers`) before we add
marketplace opt-in UI. Keep V1 light and trustworthy.

## V1 listing rule (recommended)

A business may appear in marketplace search when **all** of the following are true:

1. **Has an account** — owned `business_profiles` row linked to an auth user.
2. **Pro / paid** — current Pro entitlement (paying or active trial if we allow it).
3. **Public profile live** — existing `isPublicBusinessProfileLive` rules still pass
   (slug, active services, subscription status, etc.).
4. **Service area saved** — primary row in `business_service_areas` with city,
   state, center point, and radius.
5. **At least one active service** — bookable service exists.
6. **Marketplace opt-in** — owner explicitly enables “Show me to nearby customers”
   (separate from saving location).

If any check fails → hide from search. Do not soft-show incomplete profiles.

## Verified badge (deferred)

Do **not** invent a separate “Verified” badge for V1.

Recommended later:

| Signal | Meaning | When to show |
| --- | --- | --- |
| Pro | Paying / serious operator | While Pro entitlement is active |
| Service area confirmed | Location + radius saved | After service area exists |
| Active | Recent bookings or recent login | Optional later anti-ghost rule |

V1 trust can simply be:

- Only Pro businesses are eligible to list
- Rating + review count on cards when available
- No fake “Verified” checkmark until the rules above are productized

Open question: should Free users ever list? Default for launch: **No — Pro only**.

## Account / activity checklist

### Required for listing (V1)

- [ ] Auth account exists
- [ ] Business profile exists
- [ ] Pro entitlement active
- [ ] Public booking profile is live
- [ ] Primary service area saved
- [ ] Marketplace opt-in enabled
- [ ] ≥ 1 active service

### Nice-to-have later (not blockers)

- [ ] Logo uploaded
- [ ] Photos uploaded
- [ ] Reviews exist
- [ ] Recent activity (booking or login within N days)
- [ ] Response-time / availability signal

## How someone gets listed (product flow)

1. Sign up / log in
2. Complete required service area (city/state + radius) — web + mobile
3. Keep Pro active
4. Enable marketplace listing (future toggle)
5. Appear in `/find-detailers` search for customers in range

Location collection and listing opt-in stay separate:

- Saving a service area does **not** auto-list the business
- Opt-in does **not** skip Pro / live-profile / service-area checks

## Anti-spam / quality notes

- Rate-limit public search (already in place)
- Prefer Pro-only listing for launch quality
- Later: pause listings with no activity for 60–90 days and ask for reconfirm
- Never expose private mobile home coordinates in public APIs

## Implementation notes (when we build it)

- Add boolean on business profile or listings table, e.g. `marketplace_listed_at`
- Search API filters: Pro + live + service area + opt-in
- Dashboard copy: “Show me to nearby customers”
- No badge UI until eligibility rules are live and stable
