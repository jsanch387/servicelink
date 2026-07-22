# Service area collection (shipped) + marketplace (gated)

**Status:** Collecting service areas on web (mobile next). Public marketplace is **off**.  
**Last updated:** July 21, 2026

---

## What’s live now

| Piece                                            | Status                                       |
| ------------------------------------------------ | -------------------------------------------- |
| “Where do you serve?” dashboard modal            | Live                                         |
| MapTiler city / ZIP autocomplete                 | Live                                         |
| Persist primary area to `business_service_areas` | Live                                         |
| Session skip (“I’ll add it later”)               | Live — re-prompts next visit                 |
| Hide modal once primary area exists              | Live                                         |
| Public `/find-detailers` + search API            | **Gated off** (`MARKETPLACE_PUBLIC_ENABLED`) |

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

## Next (after enough coverage data)

1. PostGIS / radius matching from customer search point → businesses in range
2. Sort by distance, then rating
3. Marketplace opt-in (separate from location completeness) — see `docs/plans/marketplace-listing-eligibility.md`
4. Set `MARKETPLACE_PUBLIC_ENABLED=true` in production when ready
5. Optional: make service-area prompt non-dismissible

Do not treat saving a service area as marketplace listing opt-in.

---

## Related docs

| Doc                                                                    | Purpose                           |
| ---------------------------------------------------------------------- | --------------------------------- |
| `docs/contracts/mobile-service-area-collection.md`                     | Mobile implementation contract    |
| `docs/plans/marketplace-listing-eligibility.md`                        | Who may appear in search (future) |
| `supabase/migrations/20260721180000_create_business_service_areas.sql` | Schema + RLS source of truth      |
