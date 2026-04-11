# Public API rate limiting

This folder contains **abuse throttling** for unauthenticated HTTP handlers tied to the **public business profile** experience: quote requests, profile view analytics, and the optional JSON profile API.

Rate limits are **not** used for authentication or identity—they only reduce automated spam, scraping, and accidental stampedes.

---

## Strategy

### Goals

1. **Quote intake (`POST /api/public/quote-request`)** — Highest risk: writes to the database and triggers owner workflows. Limits are **strict** per client IP and per **IP + business slug** so one actor cannot flood a single business or spray many businesses from one host.
2. **View tracking (`POST /api/analytics/track-view`)** — Called when a public profile is viewed. Limits are **looser per IP** (many legitimate refreshes / navigations) but **tighter per IP + slug** over a short window to cap hammering one profile.
3. **Profile JSON API (`GET /api/public/profile/[slug]`)** — Read-heavy; limits discourage bulk scraping while allowing normal client or integration usage.

### Two-tier keys

Every protected route applies **two** checks when relevant:

| Tier | Purpose |
|------|--------|
| **Per IP** | Caps total volume from one network path (bot farms still distributed, but casual abuse is blocked). |
| **Per IP + slug** | Caps targeting of a **specific** business slug from one IP (reduces harassment of one profile). |

Slugs are normalized to **128 characters** for keys (see `safeSlugSegment` in `publicApiRateLimit.ts`).

### Distributed vs in-process

| Mode | When | Behavior |
|------|------|----------|
| **Upstash (Redis)** | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set | [Upstash Ratelimit](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview) sliding windows; counts are **shared across all serverless instances**. **Use this in production** on Vercel (or any multi-instance host). |
| **Memory fallback** | Env vars missing | `SlidingMemoryLimiter` keeps a sliding window **per Node isolate**. Effective on a single instance or for local dev; **under heavy parallel traffic each instance has its own counters**, so limits are softer globally. |

### Client IP

`getClientIp.ts` derives a stable string for rate-limit keys from (in order):

1. `x-forwarded-for` — first hop only  
2. `x-real-ip`  
3. `cf-connecting-ip` (Cloudflare)

Values are lightly **sanitized** for use as key material only. **Misconfigured reverse proxies** can make `x-forwarded-for` untrustworthy; fix proxy headers in infrastructure rather than relying on IP for security decisions.

---

## Current limits (code is source of truth)

Defined in `publicApiRateLimit.ts` (tune there if product needs change).

| Route | Check | Limit | Window |
|-------|--------|-------|--------|
| `POST /api/public/quote-request` | Per IP | 45 | 1 hour |
| `POST /api/public/quote-request` | Per IP + slug | 10 | 1 hour |
| `POST /api/analytics/track-view` | Per IP | 400 | 1 hour |
| `POST /api/analytics/track-view` | Per IP + slug | 120 | 15 minutes |
| `GET /api/public/profile/[slug]` | Per IP | 360 | 1 hour |
| `GET /api/public/profile/[slug]` | Per IP + slug | 150 | 15 minutes |

### Additional hardening (quote POST)

- **`Content-Length`** over **64 KiB** → **413** before `request.json()` (see `assertReasonableJsonBodySize` in `publicApiRateLimit.ts` and usage in `app/api/public/quote-request/route.ts`).
- If `Content-Length` is absent, the body is not pre-rejected by size (streaming); abuse volume is still bounded by rate limits.

---

## HTTP behavior when limited

- **429 Too Many Requests** — JSON body: `{ "success": false, "error": "Too many requests. Please try again in a few minutes." }`  
- Headers: **`Retry-After`** (seconds), **`Cache-Control: no-store`**.

Clients (e.g. public quote form) should surface `error` to the user and respect backoff when possible.

---

## Environment variables

| Variable | Required for distributed limits | Description |
|----------|----------------------------------|-------------|
| `UPSTASH_REDIS_REST_URL` | Yes, together with token | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes, together with URL | Upstash Redis REST token |

Create a Redis database in the [Upstash console](https://console.upstash.com/), then add both variables to Vercel (or your host). Without them, the **memory limiter** still runs.

---

## Implementation map

| File | Role |
|------|------|
| `getClientIp.ts` | Resolve client IP string from `NextRequest` headers. |
| `slidingMemoryLimiter.ts` | In-process sliding window; bounded map size. |
| `publicApiRateLimit.ts` | Upstash vs memory wiring, exported `assert*` helpers and body-size guard. |

### Call sites

| API route | What runs |
|-----------|-----------|
| `app/api/public/quote-request/route.ts` | Body size (if `Content-Length` present) → parse/validate → `assertPublicQuoteRequestRateLimits` → business rules → insert. |
| `app/api/analytics/track-view/route.ts` | Slug validation → `assertPublicTrackViewRateLimits` → DB update. |
| `app/api/public/profile/[slug]/route.ts` | `assertPublicProfileGetRateLimits` → Supabase reads. |

---

## What is not rate limited here

- **SSR public profile page** (`app/[business-slug]/page.tsx`) — served as HTML; caching/CDN is the primary lever. Abuse of *writes* and *analytics* is what this stack targets.
- **Other public POST routes** (e.g. `POST /api/public/bookings`) — not part of this module yet; add similar helpers if needed.

---

## Operations & tuning

1. **Change limits** — Edit the numbers passed to `createLimiter` / `consume` in `publicApiRateLimit.ts`, deploy, and monitor 429 rates.
2. **False positives** — Legitimate users behind a **shared NAT** share one IP; if 429s spike, raise per-IP ceilings or shorten windows for the affected route only.
3. **Observability** — Log or metric on `429` responses in your APM; Upstash dashboard shows Redis command volume if using cloud mode.

---

## Security notes

- Rate limiting **complements** but does not replace: validation (`validatePublicQuoteRequestBody`), business rules (`publicQuoteRequestAllowedForSlug`), auth on owner routes, RLS, and WAF/CDN rules where available.
- **Do not** treat client IP as proof of identity; it is only a **throttle key**.
