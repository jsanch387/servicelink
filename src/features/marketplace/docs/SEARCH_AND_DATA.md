# Marketplace search & data

Last updated: July 22, 2026

Shared implementation: `server/searchMarketplaceBusinesses.ts`. Used by the public search API and city-page SSR.

---

## Eligibility (who can appear)

A candidate must pass **all** of:

| Check               | Source                                             |
| ------------------- | -------------------------------------------------- |
| Detail business     | `business_profiles.business_type` ILIKE `%detail%` |
| Public slug         | Non-null `business_slug`                           |
| Public profile live | `isPublicBusinessProfileLive(owner)` on `profiles` |
| Pro access          | `isProAccess(...)` on owner subscription fields    |
| ≥ 1 active service  | `business_services` where `is_active`              |
| Not denylisted      | Owner Auth email ∉ `marketplaceListingDenylist`    |

**Not required for V1:** owner marketplace opt-in. Pros with a live profile and services can appear when location matching succeeds.

Empty portfolio photos still list (card shows a placeholder) — quality is on the owner; weak visuals get fewer clicks.

---

## Manual denylist

File: `config/marketplaceListingDenylist.ts`

- List **login / Auth emails** (case-insensitive).
- Search loads owner email via `admin.auth.admin.getUserById(profile_id)` — there is **no** `business_profiles.email` column in the live DB.
- Use for test accounts that should not receive real customer bookings.

---

## Location matching (hybrid)

### Input parsing

`parseMarketplaceLocation(locationQuery)`:

- City (+ optional state): e.g. `Austin, TX`
- Five-digit ZIP alone
- Rejects empty / too long / “current location” as a typed city string

Client “Use my current location” reverse-geocodes via MapTiler first, then searches with the resolved label.

### Search center

`geocodeMarketplaceSearchPoint(display)` → MapTiler (`customer-search` mode) → `{ latitude, longitude }` or `null`.

If geocode fails, search falls back to **legacy text match only**.

### Two match paths

| Business has primary active `business_service_areas`? | Behavior                                                                                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Yes**                                               | Include only if haversine distance from search center → area center ≤ `radius_miles`. Prefer BSA `label` (or city + state) for card `serviceArea`. |
| **No**                                                | Legacy: `service_area` text contains city words; optional state letter check; ZIP path uses `business_zip`.                                        |

BSA is authoritative when present: radius match only (no double-count via legacy text for those rows).

Helpers:

- `server/haversineMiles.ts` — distance in miles
- `server/geocodeMarketplaceSearchPoint.ts` — MapTiler geocode

### Sort order

1. Known distance ascending (closer first), when available
2. Then rating (nulls last), review count, name

### Caps

- Max **50** candidate businesses before enrichment / return
- Card services: up to **3**, ordered by **lowest** `price_cents` first (“From $X” is the real starting price)
- Portfolio URLs: up to **3** gallery paths by `position`; card UI may also fall back to banner/logo for the photo strip

---

## Data tables touched

| Table                    | Use                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `business_profiles`      | Candidate pool, slug, bio, logo/banner paths, legacy `service_area` / `business_zip`, `service_location_mode` |
| `business_service_areas` | Primary active area: lat/lng, radius, label for radius matching                                               |
| `profiles`               | Owner Pro + public-live gates                                                                                 |
| `business_services`      | Active services + prices                                                                                      |
| `reviews`                | Avg rating + count (`is_hidden = false`)                                                                      |
| `business_images`        | Portfolio strip (storage paths → public URLs)                                                                 |
| Auth users               | Email for denylist only (admin `getUserById`)                                                                 |

Storage URLs use the media bucket public URL helper (`MEDIA_CONFIG.bucketName`).

**Do not** expose private home coordinates in the public API response — only display labels and listing metadata.

---

## API response shape

`types/marketplace.ts` → `MarketplaceBusiness`:

| Field                                   | Notes                                               |
| --------------------------------------- | --------------------------------------------------- |
| `id`, `name`, `slug`                    | Profile identity + public URL                       |
| `description`                           | Bio                                                 |
| `serviceArea`                           | BSA label when radius-matched, else legacy text     |
| `locationMode`                          | `mobile_only` / `shop_only` / `both` → card labels  |
| `logoUrl`, `bannerUrl`, `portfolioUrls` | Public image URLs                                   |
| `services`                              | Up to 3 `{ id, name, priceCents }` (cheapest first) |
| `rating`, `reviewCount`                 | Aggregated from reviews                             |

Client: `api/searchMarketplace.ts` → `GET /api/public/marketplace/search?location=...`  
Cache headers on success: `s-maxage=60, stale-while-revalidate=300`.  
Rate limit: `assertPublicMarketplaceSearchRateLimit`.

---

## City allowlist

`config/marketplaceCities.ts`:

- Each entry: `slug`, `displayName`, `searchQuery`, etc.
- Drives static params, sitemap (when flag on), hub `?location=` → city redirect via `matchMarketplaceCity`
- Expand only when Pro density justifies a non-empty city page

---

## Card photo strip (UI)

`components/MarketplaceResultCard.tsx` / `portfolioPhotosFor`:

| Real photos available | Strip layout        |
| --------------------- | ------------------- |
| 3                     | Three equal columns |
| 2                     | Split in half       |
| 1                     | Full width          |
| 0                     | Single placeholder  |

Gallery URLs first; banner/logo used only as fallbacks to fill up to three when gallery is short.
