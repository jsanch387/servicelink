# Contract: Mobile — Service area collection (“Where do you serve?”)

Collect the business’s **mobile service coverage** (city/state center + travel
radius) the same way web does. This is **not** a home address and **not** a shop
address.

Web reference:

- Overview: `docs/service-area-collection.md`
- Autocomplete: `src/features/location/`
- Modal UX: `src/features/business-profile/components/BusinessLocationRequiredModal.tsx`
- Save API: `POST /api/business-profile/service-area`
- Show/hide: primary row on `public.business_service_areas`

---

## Product rules (match web)

1. Prompt after onboarding is complete (home / main screen).
2. **Do not** prefill the search input from legacy `business_profiles.service_area`
   / `business_zip`. Start empty.
3. User must pick a **MapTiler suggestion** (city or ZIP). Free-typed text alone
   is not enough — you need structured city, state, lat, lng from the pick.
4. City + state are enough. ZIP is optional; if the suggestion includes a ZIP,
   save it.
5. Default travel distance: **25 miles**. Allowed range: **1–200**.
6. Skip (“I’ll add it later”) is allowed for now: dismiss for **this app
   session** only; show again on the next cold start / new session until they
   confirm. Later we will make it non-dismissible (`SERVICE_AREA_PROMPT_DISMISSIBLE`
   on web → equivalent flag on mobile).
7. If a primary active service area already exists → **never** show the prompt.
8. Saving a service area does **not** publish them to marketplace search.

---

## When to show the modal

**Source of truth:** `public.business_service_areas` (not local storage alone).

After auth + onboarding complete, resolve the owner’s `business_profiles.id`,
then:

```ts
const { data } = await supabase
  .from('business_service_areas')
  .select('id')
  .eq('business_profile_id', businessProfileId)
  .eq('is_primary', true)
  .eq('is_active', true)
  .maybeSingle();

const hasConfirmedServiceArea = Boolean(data?.id);
```

| `hasConfirmedServiceArea` | Behavior                                  |
| ------------------------- | ----------------------------------------- |
| `true`                    | Do not show the prompt                    |
| `false`                   | Show prompt (unless skipped this session) |

**Skip (session only):** store a session flag keyed by `businessProfileId`
(equivalent to web `sessionStorage` key
`servicelink:service-area-skip:<businessProfileId>`). Clear it after a
successful confirm.

RLS: owners can `select` their own rows
(`business_profiles.profile_id = auth.uid()`).

---

## MapTiler autocomplete (same as web)

Use **MapTiler Geocoding API** directly from the app (same provider as web).

|                | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Base URL       | `https://api.maptiler.com/geocoding`                                       |
| Forward search | `GET /geocoding/{query}.json`                                              |
| Auth           | Query param `key=<MAPTILER_API_KEY>` (web: `NEXT_PUBLIC_MAPTILER_API_KEY`) |

### Query params (service-area mode)

| Param          | Value                                     |
| -------------- | ----------------------------------------- |
| `key`          | MapTiler API key                          |
| `country`      | `us`                                      |
| `language`     | `en`                                      |
| `autocomplete` | `true`                                    |
| `limit`        | `5`                                       |
| `types`        | `place,municipality,locality,postal_code` |

Do **not** include `address` for this flow — we want city / ZIP centers, not
street addresses.

### Client UX (match web)

- Min query length: **3**
- Debounce: **~450ms**
- Cancel in-flight requests when the query changes
- Optional short session cache (~15 min) keyed by normalized query
- Suggestion primary text: display label (see below), **not** raw
  `place_name` (avoid “78660, Texas, United States”)
- Suggestion kind label for UI:
  - `postal_code` → `ZIP code`
  - `place` / `municipality` / `locality` / … → `City`
  - Never show MapTiler jargon like “municipality” to users

### Map each MapTiler feature → structured location

From the feature + `context` hierarchy:

| Field        | How to get it                                                               |
| ------------ | --------------------------------------------------------------------------- |
| `city`       | First of types: `place`, `municipality`, `locality`, `municipal_district`   |
| `state`      | `region` → 2-letter US code (`short_code` like `US-TX` → `TX`, or name map) |
| `zip`        | `postal_code` → 5-digit match, or `""` if none                              |
| `latitude`   | `center[1]`                                                                 |
| `longitude`  | `center[0]`                                                                 |
| `providerId` | `feature.id`                                                                |
| `placeType`  | `feature.place_type[0]`                                                     |
| `label`      | `"{city}, {state}"` or `"{city}, {state} {zip}"` if zip present             |

**Drop** features missing city, state, or finite lat/lng.

After the user taps a suggestion, the input must show **`label`** (what they
clicked), not MapTiler’s `place_name`.

Web implementation to mirror:
`src/features/location/api/mapTilerGeocoding.ts`
(`mapFeature`, `searchMapTilerLocations`).

---

## Save endpoint (preferred write path)

Prefer this API over raw inserts so web and mobile stay in sync (including
legacy `business_profiles.service_area` / `business_zip`).

|                |                                                               |
| -------------- | ------------------------------------------------------------- |
| **Method**     | `POST`                                                        |
| **Path**       | `/api/business-profile/service-area`                          |
| **Production** | `https://myservicelink.app/api/business-profile/service-area` |
| **Local**      | `http://localhost:3000/api/business-profile/service-area`     |

### Authentication

| Header          | Value                            | Required         |
| --------------- | -------------------------------- | ---------------- |
| `Authorization` | `Bearer <Supabase access_token>` | **Yes** (mobile) |
| `Content-Type`  | `application/json`               | Yes              |

Web uses cookies; mobile **must** send Bearer (same pattern as other mobile
contracts).

### Request body (JSON)

| Field             | Type           | Required | Notes                                         |
| ----------------- | -------------- | -------- | --------------------------------------------- |
| `label`           | string         | Yes\*    | e.g. `Austin, TX` or `Pflugerville, TX 78660` |
| `city`            | string         | Yes      | From MapTiler pick                            |
| `stateCode`       | string         | Yes      | 2-letter uppercase, e.g. `TX`                 |
| `postalCode`      | string \| null | No       | 5-digit ZIP if present; otherwise omit/`null` |
| `latitude`        | number         | Yes      | Coverage center                               |
| `longitude`       | number         | Yes      | Coverage center                               |
| `radiusMiles`     | number         | Yes      | Integer 1–200 (default UI: 25)                |
| `placeType`       | string \| null | No       | MapTiler place type                           |
| `providerPlaceId` | string \| null | No       | MapTiler `feature.id`                         |

\*If `label` is omitted, server builds `"{city}, {stateCode}"`.

```json
{
  "label": "Austin, TX",
  "city": "Austin",
  "stateCode": "TX",
  "postalCode": null,
  "latitude": 30.2672,
  "longitude": -97.7431,
  "radiusMiles": 25,
  "placeType": "place",
  "providerPlaceId": "place.123"
}
```

### Success (HTTP `200`)

```json
{ "success": true }
```

### Errors

| Status | Meaning                                       |
| ------ | --------------------------------------------- |
| `401`  | Missing/invalid Bearer                        |
| `400`  | Validation (city/state, coords, radius, etc.) |
| `404`  | No business profile for user                  |
| `500`  | Database write failed                         |

### What the server writes

1. Upserts **primary** row on `business_service_areas` for this business
   (`is_primary = true`, `is_active = true`, `provider = 'maptiler'`).
2. Soft-syncs legacy columns on `business_profiles`:
   - `service_area` → `"City, ST"`
   - `business_zip` → ZIP or `null`

Do **not** skip the API and only write the table unless you also update those
legacy fields the same way.

---

## Database: `public.business_service_areas`

Mobile service coverage centers. Coordinates are **private** — never expose
lat/lng from public marketplace APIs.

### Columns

| Column                | Type          | Notes                                      |
| --------------------- | ------------- | ------------------------------------------ |
| `id`                  | `uuid` PK     | Default `gen_random_uuid()`                |
| `business_profile_id` | `uuid` FK     | → `business_profiles.id` ON DELETE CASCADE |
| `label`               | `text`        | Display string                             |
| `city`                | `text`        | Required                                   |
| `state_code`          | `text`        | 2-letter uppercase                         |
| `postal_code`         | `text` null   | Optional 5-digit ZIP                       |
| `country_code`        | `text`        | Default `US`                               |
| `latitude`            | `float8`      | Coverage center                            |
| `longitude`           | `float8`      | Coverage center                            |
| `radius_miles`        | `int`         | 1–200                                      |
| `place_type`          | `text` null   | MapTiler type                              |
| `provider`            | `text`        | `maptiler`                                 |
| `provider_place_id`   | `text` null   | MapTiler feature id                        |
| `is_primary`          | `boolean`     | Default `true`                             |
| `is_active`           | `boolean`     | Default `true`                             |
| `verified_at`         | `timestamptz` | Set on confirm                             |
| `created_at`          | `timestamptz` |                                            |
| `updated_at`          | `timestamptz` | Trigger-maintained                         |

### Indexes / constraints (summary)

- Unique **one primary** per business:
  `(business_profile_id) WHERE is_primary = true`
- Index on `business_profile_id`
- Checks: radius, lat/lng, state/country length, optional ZIP regex

### RLS

| Role            | Access                                                        |
| --------------- | ------------------------------------------------------------- |
| `anon`          | None                                                          |
| `authenticated` | Owner CRUD only (`business_profiles.profile_id = auth.uid()`) |
| `service_role`  | Full (server / future search)                                 |

---

## Suggested mobile checklist

- [ ] MapTiler key configured (same project / types as web)
- [ ] Autocomplete maps features to the structured fields above
- [ ] Input shows selected `label`
- [ ] On home: query primary active `business_service_areas` → decide modal
- [ ] Session skip supported; re-prompt next session until confirmed
- [ ] Confirm calls `POST /api/business-profile/service-area` with Bearer
- [ ] After success, treat as confirmed (hide modal; clear session skip)
- [ ] Do not expose lat/lng in any public UI

---

## Out of scope (for now)

- Public marketplace / find-detailers (gated by `MARKETPLACE_PUBLIC_ENABLED`)
- PostGIS radius search
- Shop / branch table (`business_locations`)
- Making the prompt non-dismissible (flip when product is ready)
