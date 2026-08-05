# Marketplace flows

Last updated: July 22, 2026

## What this feature is

Customers search for nearby **auto detailers** and open a public business profile to book.

| Route                                          | Role                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `/find-detailers`                              | Hub — hero, search, marketing sections                       |
| `/find-detailers/{city-slug}`                  | City results page — SSR listings (any valid city / ZIP slug) |
| `GET /api/public/marketplace/search?location=` | Client search API (rate-limited)                             |

Curated metros in `config/marketplaceCities.ts` stay in the sitemap + hub crawl links. Any other location (e.g. `los-angeles-ca`, `78701`) resolves dynamically via `resolveMarketplaceCityFromSlug`.

---

## Kill switch

|        |                                                                   |
| ------ | ----------------------------------------------------------------- |
| Helper | `config/isMarketplacePublicEnabled.ts`                            |
| Value  | Hardcoded `true` (launched); set the constant to `false` to pull. |

When **off**:

1. Middleware redirects `/find-detailers` (+ city paths) home; marketplace public API → 404
2. Hub / city pages call `notFound()`
3. Search API returns 404 JSON
4. Nav / footer “Find detailers” links are omitted
5. Sitemap omits hub + city URLs; robots stay noindex for those pages when gated

Owner **service area collection** does **not** depend on this flag.

---

## End-to-end: customer search

```mermaid
flowchart TD
  A[Customer opens /find-detailers] --> B{City page?}
  B -->|Yes /find-detailers/slug| C[SSR: searchMarketplaceBusinesses]
  B -->|No hub| D[MarketplacePage hero + search]
  D --> E[User submits city / ZIP / geolocation]
  E --> F[Slugify location]
  F --> G[Navigate to /find-detailers/slug]
  C --> I[MarketplaceResults cards]
  G --> C
  I --> J[Link to /business-slug?ref=marketplace public profile]
```

### Hub (`MarketplacePage`)

1. Renders hero + `MarketplaceSearch` until a search has run (or city SSR seeds results).
2. On submit: slugify the location and `router.push` to `/find-detailers/{slug}` (shareable SEO + analytics path). Legacy `?location=` links redirect to the same city URL.
3. While fetching on the same city page: results layout + **skeleton cards** (`MarketplaceResultsSkeleton`).
4. Cards: `MarketplaceResultCard` — adaptive 1/2/3 photo strip, logo, rating, area, location mode, “From $X”, View.

### City page (`app/find-detailers/[city]/page.tsx`)

1. Resolve slug via `resolveMarketplaceCityFromSlug` (curated or dynamic).
2. SSR call `searchMarketplaceBusinesses(city.searchQuery)`.
3. Pass `initialBusinesses` + `citySlug` into `MarketplacePage`.
4. Emit ItemList / CollectionPage JSON-LD; crawlable `sr-only` links to profiles.
5. Index when curated **or** the page has at least one listing; empty dynamic cities stay `noindex,follow`.

### Shared search core

All listing paths go through **`server/searchMarketplaceBusinesses.ts`** (see [SEARCH_AND_DATA.md](./SEARCH_AND_DATA.md)).

---

## Booking attribution

Result cards link to `/{slug}?ref=marketplace`. Middleware swaps that param for a cookie and redirects to the clean URL, and whichever booking API the customer reaches stores `referral_source = 'marketplace'` on the booking. That is how we tell marketplace-driven bookings apart from direct ones — see [`features/booking-attribution/README.md`](../../booking-attribution/README.md).

The `sr-only` crawlable links on city pages stay untagged so search engines index the canonical profile URL rather than a redirect.

---

## Folder layout

```
src/features/marketplace/
  api/           Client fetch wrapper for public search
  components/    Hub UI, search, results, cards, skeleton, marketing blocks
  config/        Flag, cities, listing denylist
  docs/          This documentation
  seo/           Hub + city JSON-LD builders
  server/        Search, geocode helper, haversine
  types/         MarketplaceBusiness + API response types
  index.ts       Public exports for app routes / nav
```

App wiring (not under the feature folder):

| Path                                             | Purpose                                            |
| ------------------------------------------------ | -------------------------------------------------- |
| `src/app/find-detailers/page.tsx`                | Hub route + metadata                               |
| `src/app/find-detailers/[city]/page.tsx`         | City route + SSR                                   |
| `src/app/api/public/marketplace/search/route.ts` | Public GET search                                  |
| `src/middleware.ts`                              | Gate paths when flag off                           |
| `src/app/sitemap.xml/route.ts`                   | Hub + city URLs when flag on                       |
| `src/constants/routes.ts`                        | `FIND_DETAILERS`, `FIND_DETAILERS_CITY`, API route |

---

## Soft-launch product rules (current)

- **Pro-only auto-inclusion** — no owner marketplace opt-in toggle yet.
- **No marketplace Pro badges on cards** — everyone listed is Pro; badge would be noise.
- **Manual denylist** — test/internal Auth emails excluded in `config/marketplaceListingDenylist.ts`.
- **Cities** — any valid city/ZIP gets a `/find-detailers/{slug}` URL; curated metros stay in the sitemap for crawl priority. Empty dynamic city pages are `noindex` until they have listings.
- Ads / shares should land on `/find-detailers` or a city URL, not the marketing home.

---

## Deferred (do not assume shipped)

- Owner opt-in (“Show me to nearby customers”)
- Card chrome for “Travels up to X mi”
- PostGIS / geo index (V1 uses haversine in app code)
- Hard photo-quality gates for listing
- Free-tier marketplace listing
