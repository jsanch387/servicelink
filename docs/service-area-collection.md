# Service area collection (shipped) + marketplace (gated)

**Status:** Collecting service areas on web (mobile next). Public marketplace is **off**.  
**Last updated:** July 21, 2026

---

## What’s live now

| Piece                                            | Status                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| “Where do you serve?” dashboard modal            | Live                                                                            |
| MapTiler city / ZIP autocomplete                 | Live                                                                            |
| Persist primary area to `business_service_areas` | Live                                                                            |
| Session skip (“I’ll add it later”)               | Live — re-prompts next visit                                                    |
| Hide modal once primary area exists              | Live                                                                            |
| Public `/find-detailers` + search API            | **Gated** (`MARKETPLACE_PUBLIC_ENABLED`) — see `src/features/marketplace/docs/` |

Address collection does **not** depend on the marketplace flag.

---

## Marketplace flag (keep off until ready)

|         |                                                                 |
| ------- | --------------------------------------------------------------- |
| Env var | `MARKETPLACE_PUBLIC_ENABLED`                                    |
| Default | Off (anything other than exact `true`)                          |
| Code    | `src/features/marketplace/config/isMarketplacePublicEnabled.ts` |

When **off**, all of these must fail closed:

1. Middleware — `/find-detailers` → redirect home; `/api/public/marketplace/*` → 404
2. Page — `notFound()`
3. Search API — 404 JSON

**Ship checklist:** production/staging env must **omit** the var or set `false`. Do not set `true` until discovery launch.

Local QA:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/find-detailers
# expect: 307 …/  (or similar redirect to home)

curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:3000/api/public/marketplace/search?location=Austin,%20TX"
# expect: 404
```

Restart `npm run dev` after changing `.env.local` so middleware picks up the flag.

---

## Data model (coverage, not home address)

Table: `public.business_service_areas`

- One **primary** active row per business (partial unique index)
- Stores: `label`, `city`, `state_code`, optional `postal_code`, `latitude` / `longitude`, `radius_miles`, MapTiler metadata
- RLS: owner CRUD only; **no anon** access (coords stay private)
- Migration: `supabase/migrations/20260721180000_create_business_service_areas.sql`

Confirm also soft-syncs legacy `business_profiles.service_area` + `business_zip` for older text search.

**Never** return lat/lng from public marketplace APIs.

---

## Web flow

1. Onboarding complete → dashboard loads
2. If no primary active `business_service_areas` row → show modal (unless skipped this browser session)
3. User picks MapTiler suggestion + travel radius (default 25 mi)
4. `POST /api/business-profile/service-area` upserts primary row
5. Next visit: row exists → modal stays closed

| Concern          | Location                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| Modal            | `src/features/business-profile/components/BusinessLocationRequiredModal.tsx` |
| Dismissible flag | `SERVICE_AREA_PROMPT_DISMISSIBLE` in `serviceAreaPrompt.ts`                  |
| MapTiler         | `src/features/location/api/mapTilerGeocoding.ts`                             |
| Save API         | `src/app/api/business-profile/service-area/route.ts` (cookies or Bearer)     |
| Show/hide        | `src/app/dashboard/page.tsx` → `hasConfirmedServiceArea`                     |

Flip `SERVICE_AREA_PROMPT_DISMISSIBLE` to `false` when the prompt should become blocking.

---

## Mobile

Mirror web using:

**`docs/contracts/mobile-service-area-collection.md`**

Same MapTiler mapping, same table for show/hide, same save API with Bearer.

---

## Next — soft launch plan (target: end of month)

While service areas fill in, ship a **thin, Pro-only** marketplace using what
you already have. Do **not** block launch on PostGIS.

### Who gets listed (V1 — hard rules)

Only businesses that pass **all**:

1. Account + business profile
2. **Active Pro** (`isProAccess`) — no Free listings
3. Onboarding complete / public profile live
4. ≥ 1 active service
5. Location signal: primary `business_service_areas` **or** (soft launch only)
   legacy `service_area` city match until enough people confirm the modal

**Defer for V1.1:** marketplace opt-in toggle. For first public week, treat
“Pro + live + services + location” as enough; add opt-in once volume exists so
you don’t launch empty.

See also `docs/plans/marketplace-listing-eligibility.md`.

### Owner path to get listed (checklist copy)

1. Complete onboarding
2. Stay on Pro
3. Confirm “Where do you serve?” (city/state + radius)
4. Keep ≥ 1 active service on a live public profile
5. (Later) Toggle “Show me to nearby customers”

### Build order (meantime → launch)

| Priority | Work                                                                                                           | Why                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| P0       | Search API: **Pro-only** filter (`isProAccess`)                                                                | Stops Free/tire-kickers in results                                |
| P0       | Prefer `business_service_areas`; fall back to city/`service_area` match                                        | Use confirmed coverage first, keep density while collection ramps |
| P0       | Find-detailers **page cleanup** (below)                                                                        | Looks ready when you flip the flag                                |
| P1       | Empty / sparse-city UX (“No detailers near X yet — try Austin”)                                                | Soft launch honesty                                               |
| P1       | Mobile service-area collection                                                                                 | Same data web is collecting                                       |
| P1       | Make service-area prompt non-dismissible for Pro without area                                                  | Faster coverage density                                           |
| P2       | Opt-in column + dashboard toggle                                                                               | Privacy / control after density exists                            |
| P2       | Radius match + **sort by distance** using customer lat/lng ↔ `business_service_areas` center + `radius_miles` | Real “near me”; needs enough confirmed areas                      |
| P2       | `MARKETPLACE_PUBLIC_ENABLED=true` + allow index                                                                | Flip when Pro density feels OK in 1–2 metros                      |

### Distance search — are we set up correctly?

**Yes, for the next build.** Pieces already in place:

| Side             | What we have                                                                          |
| ---------------- | ------------------------------------------------------------------------------------- |
| Customer         | Browser geolocation → MapTiler reverse → **lat/lng + city/state/ZIP**                 |
| Customer (typed) | MapTiler pick → same structured point                                                 |
| Business         | `business_service_areas`: **latitude, longitude, radius_miles** (confirmed via modal) |

**Not wired yet in search API:** still city/`service_area` text match (soft launch). Distance sort = next layer: geocode query → filter businesses whose radius contains the point → sort by miles. PostGIS is optional later; haversine on lat/lng is enough for V1.

Until enough Pros confirm service areas, city text match is the right interim. Collecting coverage now is exactly what distance search needs.

### Quick fixes for `/find-detailers` (do before flip)

Keep the route gated until these land:

1. **Pro-only results** in search (must-have).
2. **Hero budget** — landing already has hero + search + trust + showcase +
   mess callouts + discovery. For launch, cut secondary marketing below the
   fold or remove 1–2 sections so search is the job.
3. **Results honesty** — empty state, loading, “X detailers near {city}”.
4. **Card quality** — require logo _or_ clear name; hide near-empty bios; keep
   rating when present.
5. **robots / meta** — page is `noindex` today; turn indexing on only when the
   flag goes true.
6. **No main-nav push** until soft launch; share direct URL / ads to Austin
   (or your densest metro) first.
7. **Seed density** — it’s fine to show Pro businesses you already have in
   Austin via current city match; don’t wait for PostGIS.

### Soft-launch decision

Go live when: Pro-only search works, page feels focused, and **one metro**
(e.g. Austin) has enough Pro results that a real ZIP search isn’t empty.

Hold PostGIS, maps, and opt-in until after that.

---

## Related docs

| Doc                                                                    | Purpose                           |
| ---------------------------------------------------------------------- | --------------------------------- |
| `docs/contracts/mobile-service-area-collection.md`                     | Mobile implementation contract    |
| `docs/plans/marketplace-listing-eligibility.md`                        | Who may appear in search (future) |
| `supabase/migrations/20260721180000_create_business_service_areas.sql` | Schema + RLS source of truth      |
