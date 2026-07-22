# Marketplace (`/find-detailers`)

Public customer discovery for auto detailers.

**Docs:** [docs/README.md](./docs/README.md) — start with [FLOWS.md](./docs/FLOWS.md).

## Quick map

| Concern                 | Where                                   |
| ----------------------- | --------------------------------------- |
| Feature flag            | `config/isMarketplacePublicEnabled.ts`  |
| City SEO allowlist      | `config/marketplaceCities.ts`           |
| Test account exclusions | `config/marketplaceListingDenylist.ts`  |
| Search + eligibility    | `server/searchMarketplaceBusinesses.ts` |
| UI shell                | `components/MarketplacePage.tsx`        |
| Result cards            | `components/MarketplaceResultCard.tsx`  |
